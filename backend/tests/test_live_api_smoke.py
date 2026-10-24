"""Reversible smoke tests for a running local Ralypto API server.

Run against a disposable seeded local database with:
    python -m unittest backend.tests.test_live_api_smoke -v

The tests use the seeded demo accounts, remove temporary booking records, and refund
their order lifecycle test. Do not target a production database.
"""
from __future__ import annotations

import json
import os
import unittest
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


BASE_URL = os.environ.get("RALYPTO_API_URL", "http://127.0.0.1:4000/api/v1")


def request(path: str, method: str = "GET", token: str | None = None,
            payload: dict | None = None) -> tuple[int, object]:
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except HTTPError as exc:
        raw = exc.read()
        try:
            body = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            body = raw.decode(errors="replace")
        return exc.code, body


class LiveApiSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        status, body = request("/auth/login", "POST", payload={
            "email": "owner@ralypto.com", "password": "pass123"
        })
        if status != 200:
            raise RuntimeError(f"Owner login failed ({status}): {body}")
        cls.owner_token = body["accessToken"]
        status, body = request("/auth/login", "POST", payload={
            "email": "cashier@ralypto.com", "password": "pass123"
        })
        if status != 200:
            raise RuntimeError(f"Cashier login failed ({status}): {body}")
        cls.cashier_token = body["accessToken"]
        status, body = request("/auth/login", "POST", payload={
            "email": "waiter@ralypto.com", "password": "pass123"
        })
        if status != 200:
            raise RuntimeError(f"Waiter login failed ({status}): {body}")
        cls.waiter_token = body["accessToken"]

    def test_auth_profile_and_tenant_data(self) -> None:
        status, body = request("/auth/me", token=self.owner_token)
        self.assertEqual(status, 200)
        self.assertEqual(body["user"]["email"], "owner@ralypto.com")
        for path in ("/menu/categories", "/menu/items", "/tables", "/kitchen/orders",
                     "/shifts/current", "/subscription", "/reports/dashboard",
                     "/reports/sales", "/reports/analytics", "/reservations", "/waitlist"):
            with self.subTest(path=path):
                status, _ = request(path, token=self.owner_token)
                self.assertEqual(status, 200)

    def test_menu_availability_change_persists_and_is_restored(self) -> None:
        status, items = request("/menu/items", token=self.owner_token)
        self.assertEqual(status, 200)
        item = next(item for item in items if item["name"] == "Chicken Kottu")
        original = item["isAvailable"]
        try:
            status, _ = request(f"/menu/items/{item['id']}", "PATCH", self.owner_token,
                                {"isAvailable": not original})
            self.assertEqual(status, 200)
            status, fresh_items = request("/menu/items", token=self.owner_token)
            self.assertEqual(status, 200)
            fresh = next(row for row in fresh_items if row["id"] == item["id"])
            self.assertEqual(fresh["isAvailable"], not original)
        finally:
            request(f"/menu/items/{item['id']}", "PATCH", self.owner_token,
                    {"isAvailable": original})
        status, fresh_items = request("/menu/items", token=self.owner_token)
        self.assertEqual(status, 200)
        self.assertEqual(next(row for row in fresh_items if row["id"] == item["id"])["isAvailable"], original)

    def test_menu_edit_requires_manager_or_owner(self) -> None:
        _, items = request("/menu/items", token=self.owner_token)
        item = items[0]
        status, _ = request(f"/menu/items/{item['id']}", "PATCH", self.cashier_token,
                            {"isAvailable": item["isAvailable"]})
        self.assertEqual(status, 403)

    def test_staff_directory_create_update_deactivate(self) -> None:
        status, rows = request("/staff", token=self.owner_token)
        self.assertEqual(status, 200)
        self.assertTrue(any(row["isOwner"] for row in rows))
        status, created = request("/staff", "POST", self.owner_token,
                                  {"name": "Smoke Staff", "role": "waiter", "phone": "+94000000003", "pin": "9876"})
        self.assertEqual(status, 201)
        self.assertNotIn("pin", created)
        try:
            status, updated = request(f"/staff/{created['id']}", "PATCH", self.owner_token,
                                      {"phone": "+94000000004", "isActive": False})
            self.assertEqual(status, 200)
            self.assertEqual(updated["phone"], "+94000000004")
            self.assertFalse(updated["isActive"])
        finally:
            status, _ = request(f"/staff/{created['id']}", "DELETE", self.owner_token)
            self.assertEqual(status, 204)

    def test_showcase_records_are_persisted_tenant_scoped_and_mutable(self) -> None:
        status, saved = request("/showcase/settings", "POST", self.owner_token,
                                {"restName": "Smoke Bistro", "taxRate": 8.5})
        self.assertEqual(status, 201)
        status, saved_again = request("/showcase/settings", "POST", self.owner_token,
                                      {"restPhone": "+94000000005"})
        self.assertEqual(status, 200)
        self.assertEqual(saved_again["restName"], "Smoke Bistro")
        self.assertEqual(saved_again["restPhone"], "+94000000005")
        status, listing = request("/showcase/settings", token=self.owner_token)
        self.assertEqual(status, 200)
        self.assertEqual(len([row for row in listing if row["key"] == "restaurant"]), 1)

        for collection, payload in (("inventory", {"name": "Smoke Rice", "quantity": 4, "unit": "kg", "reorderLevel": 2}),
                                    ("delivery", {"customer": "Smoke Guest", "phone": "000", "address": "Test", "status": "received"}),
                                    ("accounting", {"description": "Smoke expense", "category": "Other", "amountCents": 10})):
            with self.subTest(collection=collection):
                status, row = request(f"/showcase/{collection}", "POST", self.owner_token, payload)
                self.assertEqual(status, 201)
                try:
                    status, rows = request(f"/showcase/{collection}", token=self.owner_token)
                    self.assertEqual(status, 200)
                    self.assertTrue(any(item["id"] == row["id"] for item in rows))
                    status, changed = request(f"/showcase/{collection}/{row['id']}", "PATCH", self.owner_token, {"status": "updated"})
                    self.assertEqual(status, 200)
                    self.assertEqual(changed["status"], "updated")
                finally:
                    self.assertEqual(request(f"/showcase/{collection}/{row['id']}", "DELETE", self.owner_token)[0], 204)

    def test_reservation_create_update_delete(self) -> None:
        status, booking = request("/reservations", "POST", self.owner_token, {
            "customerName": "Smoke Test Guest", "customerPhone": "+94000000001",
            "partySize": 2,
            "reservationTime": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "source": "staff",
        })
        self.assertEqual(status, 201)
        try:
            status, updated = request(f"/reservations/{booking['id']}/status", "PATCH",
                                      self.owner_token, {"status": "cancelled"})
            self.assertEqual(status, 200)
            self.assertEqual(updated["status"], "cancelled")
        finally:
            status, _ = request(f"/reservations/{booking['id']}", "DELETE", self.owner_token)
            self.assertEqual(status, 200)

    def test_waitlist_create_notify_delete(self) -> None:
        status, entry = request("/waitlist", "POST", self.owner_token, {
            "customerName": "Smoke Test Guest", "customerPhone": "+94000000001",
            "partySize": 2, "estimatedWaitMinutes": 5,
        })
        self.assertEqual(status, 201)
        try:
            status, updated = request(f"/waitlist/{entry['id']}/status", "PATCH",
                                      self.owner_token, {"status": "notified"})
            self.assertEqual(status, 200)
            self.assertEqual(updated["status"], "notified")
        finally:
            status, _ = request(f"/waitlist/{entry['id']}", "DELETE", self.owner_token)
            self.assertEqual(status, 200)

    def test_public_qr_menu_order_kitchen_and_bill_flow(self) -> None:
        status, tables = request("/tables", token=self.owner_token)
        self.assertEqual(status, 200)
        table = next(row for row in tables if row["status"] == "available")
        status, menu = request(f"/public/menu/CEY101/{quote(table['number'])}")
        self.assertEqual(status, 200)
        item = next(row for row in menu["items"] if row["isAvailable"])
        status, called = request("/public/call-waiter?restaurantCode=CEY101", "POST", payload={
            "tableId": table["id"], "tableNumber": table["number"], "requestType": "waiter",
        })
        self.assertEqual(status, 200)
        self.assertTrue(called["success"])
        status, result = request("/public/orders?restaurantCode=CEY101", "POST", payload={
            "tableId": table["id"], "orderType": "qr_self_order",
            "items": [{"menuItemId": item["id"], "quantity": 1}],
        })
        self.assertEqual(status, 201)
        self.assertEqual(result["order"]["status"], "preparing")
        self.assertTrue(result["tickets"])
        ticket_id = result["tickets"][0]["id"]
        status, _ = request(f"/kitchen/tickets/{ticket_id}/status", "PATCH", self.owner_token,
                            {"status": "preparing"})
        self.assertEqual(status, 200)
        status, _ = request(f"/kitchen/tickets/{ticket_id}/status", "PATCH", self.owner_token,
                            {"status": "ready"})
        self.assertEqual(status, 200)
        status, bill = request("/public/request-bill?restaurantCode=CEY101", "POST", payload={
            "tableId": table["id"], "tableNumber": table["number"],
        })
        self.assertEqual(status, 200)
        self.assertEqual(bill["order"]["status"], "billed")

    def test_waiter_can_create_and_fire_table_order(self) -> None:
        _, tables = request("/tables", token=self.waiter_token)
        table = next(row for row in tables if row["status"] == "available")
        _, items = request("/menu/items", token=self.waiter_token)
        item = next(row for row in items if row["isAvailable"])
        status, order = request("/orders", "POST", self.waiter_token, {
            "tableId": table["id"], "orderType": "dine_in",
            "items": [{"menuItemId": item["id"], "quantity": 1}],
        })
        self.assertEqual(status, 201)
        try:
            status, fired = request(f"/orders/{order['id']}/send-to-kitchen", "POST", self.waiter_token)
            self.assertEqual(status, 200)
            self.assertEqual(fired["order"]["status"], "preparing")
            status, tickets = request("/kitchen/orders", token=self.waiter_token)
            self.assertEqual(status, 200)
            created_ticket = next(ticket for ticket in tickets if ticket["orderId"] == order["id"])
            status, _ = request(f"/kitchen/tickets/{created_ticket['id']}/status", "PATCH", self.waiter_token,
                                {"status": "ready"})
            self.assertEqual(status, 403)
            status, _ = request(f"/kitchen/tickets/{created_ticket['id']}/status", "PATCH", self.owner_token,
                                {"status": "preparing"})
            self.assertEqual(status, 200)
            status, _ = request(f"/kitchen/tickets/{created_ticket['id']}/status", "PATCH", self.owner_token,
                                {"status": "ready"})
            self.assertEqual(status, 200)
            status, collected = request(f"/kitchen/tickets/{created_ticket['id']}/status", "PATCH", self.waiter_token,
                                        {"status": "collected"})
            self.assertEqual(status, 200)
            self.assertEqual(collected["status"], "collected")
        finally:
            # Keep the disposable test database clean and preserve real app behavior.
            request(f"/orders/{order['id']}/void", "POST", self.waiter_token,
                    {"managerPin": "1234", "reason": "Temporary smoke test cleanup"})

    def test_pos_checkout_split_payment_and_refund(self) -> None:
        _, items = request("/menu/items", token=self.owner_token)
        item = next(row for row in items if row["name"] == "Chicken Kottu")
        status, order = request("/orders", "POST", self.owner_token, {
            "orderType": "takeaway", "discountCents": 5000, "serviceChargeEnabled": False,
            "items": [{"menuItemId": item["id"], "quantity": 1}],
        })
        self.assertEqual(status, 201)
        self.assertEqual(order["totalCents"], item["priceCents"] - 5000)
        order_id = order["id"]
        try:
            status, billed = request(f"/orders/{order_id}/request-bill", "POST", self.owner_token)
            self.assertEqual(status, 200)
            self.assertEqual(billed["status"], "billed")
            first_part = order["totalCents"] // 2
            status, partial = request(f"/orders/{order_id}/pay", "POST", self.owner_token, {
                "paymentMethod": "cash", "amountCents": first_part, "tenderedCents": first_part,
            })
            self.assertEqual(status, 200)
            self.assertEqual(partial["order"]["status"], "billed")
            self.assertEqual(partial["outstandingCents"], order["totalCents"] - first_part)
            status, settled = request(f"/orders/{order_id}/pay", "POST", self.owner_token, {
                "paymentMethod": "mixed",
                "allocations": [
                    {"paymentMethod": "cash", "amountCents": (order["totalCents"] - first_part) // 2},
                    {"paymentMethod": "card", "amountCents": order["totalCents"] - first_part - (order["totalCents"] - first_part) // 2},
                ],
            })
            self.assertEqual(status, 200)
            self.assertEqual(settled["order"]["status"], "completed")
            self.assertEqual(len(settled["payments"]), 2)
            status, refunded = request(f"/orders/{order_id}/refund", "POST", self.owner_token, {
                "managerPin": "1234", "reason": "Temporary smoke test order",
            })
            self.assertEqual(status, 200)
            self.assertEqual(refunded["status"], "refunded")
        except Exception:
            request(f"/orders/{order_id}/void", "POST", self.owner_token, {
                "managerPin": "1234", "reason": "Smoke test cleanup",
            })
            raise


if __name__ == "__main__":
    unittest.main(verbosity=2)
