import base64
import os
from io import BytesIO

from flask import Flask, Response, jsonify, redirect, render_template, request, send_from_directory, url_for

from extensions import db
from models import ClipboardItem


def create_app() -> Flask:
    app: Flask = Flask(__name__)

    @app.template_filter("b64encode")
    def b64encode_filter(data: bytes) -> str:
        return base64.b64encode(data).decode("utf-8")

    if os.getenv("APP_ENV") == "prod":
        app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
            "DATABASE_URL", "postgresql://clipboard:clipboard@db:5432/clipboard"
        )
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///clipboard.db"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload

    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def index() -> str:
        page: int = request.args.get("page", 1, type=int)
        per_page: int = 5
        pagination = (
            ClipboardItem.query.order_by(ClipboardItem.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )
        return render_template(
            "index.html",
            items=pagination.items,
            page=pagination.page,
            total_pages=pagination.pages,
            has_next=pagination.has_next,
            has_prev=pagination.has_prev,
        )

    @app.route("/paste", methods=["POST"])
    def paste() -> Response:
        content_type: str = request.form.get("content_type", "text")
        content_text: str | None = request.form.get("content_text")
        uploaded_file = request.files.get("content_file")

        if content_type == "file" and uploaded_file:
            file_data: bytes = uploaded_file.read()
            file_mime: str = uploaded_file.content_type or "application/octet-stream"
            file_name: str = uploaded_file.filename or "unnamed"
            item = ClipboardItem(
                content_type="file",
                content_file=file_data,
                file_name=file_name,
                file_mime=file_mime,
            )
        elif content_type in ("text", "link") and content_text:
            item = ClipboardItem(content_type=content_type, content_text=content_text)
        else:
            return redirect(url_for("index"))

        db.session.add(item)
        db.session.commit()

        return redirect(url_for("index"))

    @app.route("/item/<int:item_id>", methods=["DELETE"])
    def delete_item(item_id: int) -> dict:
        item = db.session.get(ClipboardItem, item_id)
        if item is None:
            return jsonify({"error": "Item not found"}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({"success": True}), 200

    @app.route("/item/<int:item_id>/download")
    def download_item(item_id: int) -> Response:
        item = db.session.get(ClipboardItem, item_id)
        if item is None or item.content_type != "file" or item.content_file is None:
            return jsonify({"error": "File not found"}), 404

        return Response(
            item.content_file,
            mimetype=item.file_mime or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{item.file_name}"'},
        )

    @app.route("/assets/<path:filepath>")
    def serve_assets(filepath: str) -> str:
        return send_from_directory("assets", filepath)

    return app


if __name__ == "__main__":
    application: Flask = create_app()
    application.run(debug=True, host="0.0.0.0", port=5000)
