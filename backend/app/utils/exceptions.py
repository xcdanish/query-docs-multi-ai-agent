from fastapi import HTTPException, status
from typing import Optional

class NotFoundException(HTTPException):
    """Custom exception for 404 Not Found"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class BadRequestException(HTTPException):
    """Custom exception for 400 Bad Request"""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class UnauthorizedException(HTTPException):
    """Custom exception for 401 Unauthorized"""
    def __init__(self, detail: str = "Unauthorized", headers: Optional[dict] = None):
        if not headers:
            headers = {"WWW-Authenticate": "Bearer"}
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers=headers)
