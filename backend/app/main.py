from fastapi import FastAPI
from app.routes import auth, predict, post, user, admin

# ✅ FIRST create app
app = FastAPI(
    title="EcoVision AI Backend",
    version="1.0.0",
    description="Backend API for EcoVision AI services.",
)

# ✅ THEN include routers
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(post.router)
app.include_router(user.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok", "message": "EcoVision AI backend is running."}