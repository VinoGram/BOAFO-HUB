from sqlalchemy.orm import Session
import backend.crud as crud
from fastapi import HTTPException

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def send_message(self, sender_id: int, booking_id: int, content: str):
        """
        Sends a message, enforcing business logic that customers initiate conversations.
        """
        sender = crud.get_user_by_id(self.db, sender_id)
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")

        booking = crud.get_booking_by_id(self.db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Determine receiver
        if sender_id == booking['customer']['userId']:
            receiver_id = booking['provider']['userId']
        elif sender_id == booking['provider']['userId']:
            receiver_id = booking['customer']['userId']
        else:
            raise HTTPException(status_code=403, detail="Sender is not part of this booking")

        # Check if provider is initiating
        if sender['role'] == 'provider':
            messages = crud.get_messages_for_booking(self.db, booking_id)
            customer_initiated = any(m['senderId'] == receiver_id for m in messages)
            if not customer_initiated:
                raise HTTPException(status_code=403, detail="Providers can only reply to messages from customers.")

        message = crud.create_message(self.db, {
            "bookingId": booking_id, "senderId": sender_id, "receiverId": receiver_id, "content": content
        })
        return message