from datetime import datetime, timezone

from extensions import db


class ClipboardItem(db.Model):
    __tablename__ = "clipboard_items"

    id: int = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_type: str = db.Column(db.String(20), nullable=False)
    content_text: str | None = db.Column(db.Text, nullable=True)
    content_file: bytes | None = db.Column(db.LargeBinary, nullable=True)
    file_name: str | None = db.Column(db.String(255), nullable=True)
    file_mime: str | None = db.Column(db.String(100), nullable=True)
    created_at: datetime = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        data: dict = {
            "id": self.id,
            "content_type": self.content_type,
            "created_at": self.created_at.isoformat(),
        }
        if self.content_type in ("text", "link"):
            data["content_text"] = self.content_text
        if self.content_type == "file" and self.content_file:
            import base64

            data["content_file"] = base64.b64encode(self.content_file).decode("utf-8")
            data["file_name"] = self.file_name
            data["file_mime"] = self.file_mime
        return data
