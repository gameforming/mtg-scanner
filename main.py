
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import Base, engine, get_db
from models import User, CollectionCard


app = FastAPI(
    title="MTG Scanner API",
    version="1.0.0"
)


# Maak tabellen aan
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "name": "MTG Scanner API",
        "status": "online"
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "online"
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database unavailable"
        )


@app.post("/users")
def create_user(
    username: str,
    db: Session = Depends(get_db)
):

    username = username.strip()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username is verplicht."
        )

    existing = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing:
        return {
            "id": existing.id,
            "username": existing.username
        }

    user = User(
        username=username
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username
    }


@app.get("/collection/{user_id}")
def get_collection(
    user_id: int,
    db: Session = Depends(get_db)
):

    cards = (
        db.query(CollectionCard)
        .filter(CollectionCard.user_id == user_id)
        .all()
    )

    return [
        {
            "scryfall_id": card.scryfall_id,
            "name": card.name,
            "amount": card.amount,
            "value": card.value
        }
        for card in cards
    ]


@app.post("/collection/{user_id}/add")
def add_card(
    user_id: int,
    scryfall_id: str,
    name: str,
    value: float = 0,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Gebruiker bestaat niet."
        )

    card = (
        db.query(CollectionCard)
        .filter(
            CollectionCard.user_id == user_id,
            CollectionCard.scryfall_id == scryfall_id
        )
        .first()
    )

    if card:

        card.amount += 1
        card.value = value

    else:

        card = CollectionCard(
            user_id=user_id,
            scryfall_id=scryfall_id,
            name=name,
            amount=1,
            value=value
        )

        db.add(card)

    db.commit()
    db.refresh(card)

    return {
        "scryfall_id": card.scryfall_id,
        "name": card.name,
        "amount": card.amount,
        "value": card.value
    }

