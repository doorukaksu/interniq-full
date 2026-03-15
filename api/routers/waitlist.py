from fastapi import APIRouter, HTTPException

from api.models import WaitlistRequest, WaitlistResponse
from api.services.waitlist import add_to_waitlist, get_waitlist_count

router = APIRouter()


@router.post("/waitlist", response_model=WaitlistResponse)
async def join_waitlist(body: WaitlistRequest):
    """Add an email to the InternIQ waitlist."""
    try:
        outcome = add_to_waitlist(body.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if outcome["already_existed"]:
        return WaitlistResponse(
            success=True,
            message="You're already on the waitlist — we'll be in touch soon.",
        )

    return WaitlistResponse(
        success=True,
        message="You're on the list! We'll email you when InternIQ launches.",
    )


@router.get("/waitlist/count")
async def waitlist_count():
    """Returns the current waitlist size. Useful for the social proof counter."""
    return {"count": get_waitlist_count()}
