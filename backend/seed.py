"""Create the Ceylon Spice Bistro showcase tenant and demo catalog."""
from app.main import Base, SessionLocal, engine, seed_demo


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_demo(db)
    print("Demo data is ready. Login: owner@ralypto.com / pass123 (PIN 1234).")


if __name__ == "__main__":
    main()
