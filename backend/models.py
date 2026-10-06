
from sqlalchemy import Column, Integer, String, Float, UniqueConstraint

from database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)


class CollectionCard(Base):

    __tablename__ = "collection_cards"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    scryfall_id = Column(
        String(50),
        nullable=False,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    amount = Column(
        Integer,
        nullable=False,
        default=1
    )

    value = Column(
        Float,
        nullable=False,
        default=0
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "scryfall_id",
            name="unique_user_card"
        ),
    )

