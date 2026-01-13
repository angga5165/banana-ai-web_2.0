from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

from data import provinsi, kabupaten, kecamatan, kelurahan, usaha

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "provinsi": provinsi}
    )

@app.get("/kabupaten/{prov_id}")
def get_kabupaten(prov_id: int):
    return kabupaten.get(prov_id, [])

@app.get("/kecamatan/{kab_id}")
def get_kecamatan(kab_id: int):
    return kecamatan.get(kab_id, [])

@app.get("/kelurahan/{kec_id}")
def get_kelurahan(kec_id: int):
    return kelurahan.get(kec_id, [])

@app.get("/usaha/{kel_id}")
def get_usaha(kel_id: int):
    return usaha.get(kel_id, [])
