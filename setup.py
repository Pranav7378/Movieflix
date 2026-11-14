from pathlib import Path
from typing import List

from setuptools import find_packages, setup

HYPHEN_E_DOT = "-e ."


def get_requirements(file_path: str) -> List[str]:
    requirements: List[str] = []
    with open(file_path) as file_obj:
        requirements = file_obj.readlines()
        requirements = [req.replace("\n", "").strip() for req in requirements]
        requirements = [req for req in requirements if req]

        if HYPHEN_E_DOT in requirements:
            requirements.remove(HYPHEN_E_DOT)

    return requirements


ROOT = Path(__file__).parent

setup(
    name="movie-recommender",
    version="1.0.0",
    description="Personal movie recommender and watchlist app",
    packages=find_packages(include=["src", "src.*"]),
    python_requires=">=3.11",
    install_requires=get_requirements(str(ROOT / "requirements.txt")),
)
