"""
Microservicio AFIP (stub) — Posta.
Contrato HTTP estable para enchufar WSAA/WSFEV1 sin tocar el monolito NestJS.
"""
from datetime import date, timedelta
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Posta AFIP Adapter", version="0.1.0")


class ComprobanteRequest(BaseModel):
    venta_id: str
    tipo: str
    total: str
    cuit_emisor: str | None = None


class ComprobanteResponse(BaseModel):
    cae: str
    cae_vencimiento: date
    numero_comprobante: int


@app.get("/health")
def health():
    return {"status": "ok", "service": "afip"}


@app.post("/v1/comprobantes", response_model=ComprobanteResponse)
def emitir_comprobante(body: ComprobanteRequest):
    # Stub: reemplazar por WSAA + WSFEV1 en producción
    if body.total.startswith("-"):
        raise HTTPException(status_code=503, detail="AFIP no disponible")
    return ComprobanteResponse(
        cae=str(uuid4().int)[:14],
        cae_vencimiento=date.today() + timedelta(days=10),
        numero_comprobante=abs(hash(body.venta_id)) % 1_000_000,
    )
