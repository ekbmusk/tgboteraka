from pydantic import BaseModel
from typing import Optional, List


class ProblemOut(BaseModel):
    id: int
    topic: str
    question: str
    formula: Optional[str] = None
    difficulty: str
    tags: List[str] = []
    ai_checked: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_problem(cls, problem):
        return cls(
            id=problem.id,
            topic=problem.topic,
            question=problem.question,
            formula=problem.formula,
            difficulty=problem.difficulty,
            tags=problem.tags or [],
            ai_checked=not bool(problem.correct_answer),
        )


class ProblemDetail(ProblemOut):
    correct_answer: str
    solution: Optional[str] = None


class AnswerCheck(BaseModel):
    answer: str


class AnswerResult(BaseModel):
    correct: bool
    message: str
    solution: Optional[str] = None
