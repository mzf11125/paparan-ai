#!/usr/bin/env python3
"""
Paparan AI Setup Verification Script

This script checks if your environment is properly configured for running
the Paparan AI backend.
"""

import os
import sys
from pathlib import Path

# Colors for output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"


def check_env_file():
    """Check if .env file exists."""
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        print(f"{GREEN}✓{RESET} .env file exists")
        return True
    else:
        print(f"{RED}✗{RESET} .env file not found")
        print(f"  {YELLOW}Hint: Copy .env.example to .env and fill in your values{RESET}")
        return False


def load_env():
    """Load environment variables from .env file."""
    try:
        from dotenv import load_dotenv
        env_path = Path(__file__).parent / ".env"
        load_dotenv(env_path)
        return True
    except ImportError:
        # Fallback: manually parse .env
        env_path = Path(__file__).parent / ".env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        os.environ[key.strip()] = value.strip()
        return True


def check_required_vars():
    """Check required environment variables."""
    required_vars = {
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_ANON_KEY": "Supabase anon key",
        "SUPABASE_SERVICE_ROLE_KEY": "Supabase service role key",
        "DATABASE_URL": "Database connection string",
    }

    print("\n{YELLOW}Required Configuration:{RESET}")
    all_present = True

    for var, description in required_vars.items():
        value = os.environ.get(var, "")
        if value and not value.startswith("placeholder") and not value.startswith("your-"):
            print(f"{GREEN}✓{RESET} {var}: Set")
        else:
            print(f"{RED}✗{RESET} {var}: Missing ({description})")
            all_present = False

    return all_present


def check_llm_config():
    """Check LLM provider configuration."""
    print("\n{YELLOW}LLM Provider Configuration:{RESET}")

    provider = os.environ.get("LLM_PROVIDER", "zai")
    print(f"  Selected provider: {provider}")

    has_any_key = False

    if provider == "zai":
        key = os.environ.get("ZAI_API_KEY", "")
        if key and not key.startswith("your-"):
            print(f"{GREEN}✓{RESET} ZAI_API_KEY: Set")
            has_any_key = True
        else:
            print(f"{RED}✗{RESET} ZAI_API_KEY: Missing")

    elif provider == "anthropic":
        key = os.environ.get("ANTHROPIC_API_KEY", "")
        if key and not key.startswith("your-"):
            print(f"{GREEN}✓{RESET} ANTHROPIC_API_KEY: Set")
            has_any_key = True
        else:
            print(f"{RED}✗{RESET} ANTHROPIC_API_KEY: Missing")

    elif provider == "agentrouter":
        key = os.environ.get("AGENTROUTER_API_KEY", "")
        if key and not key.startswith("your-"):
            print(f"{GREEN}✓{RESET} AGENTROUTER_API_KEY: Set")
            has_any_key = True
        else:
            print(f"{RED}✗{RESET} AGENTROUTER_API_KEY: Missing")

    elif provider == "zhipu":
        key = os.environ.get("ZHIPU_API_KEY", "")
        if key and not key.startswith("your-"):
            print(f"{GREEN}✓{RESET} ZHIPU_API_KEY: Set")
            has_any_key = True
        else:
            print(f"{RED}✗{RESET} ZHIPU_API_KEY: Missing")

    # Check for fallback keys
    print(f"\n  {YELLOW}Fallback options:{RESET}")
    for var in ["ZAI_API_KEY", "ANTHROPIC_API_KEY", "AGENTROUTER_API_KEY", "ZHIPU_API_KEY"]:
        key = os.environ.get(var, "")
        if key and not key.startswith("your-"):
            print(f"    {GREEN}✓{RESET} {var} is available")

    return has_any_key


def check_optional_services():
    """Check optional service configuration."""
    print("\n{YELLOW}Optional Services:{RESET}")

    optional_vars = {
        "TAVILY_API_KEY": ("Tavily search", "Web search, intelligence gathering"),
        "FIRMS_MAP_KEY": ("NASA FIRMS", "Fire hotspot data"),
        "ACLED_API_KEY": ("ACLED", "Conflict event data"),
        "LANGSMITH_API_KEY": ("LangSmith", "LLM tracing/debugging"),
    }

    configured_count = 0
    for var, (name, purpose) in optional_vars.items():
        value = os.environ.get(var, "")
        if value and not value.startswith("your-"):
            print(f"{GREEN}✓{RESET} {name}: Configured ({purpose})")
            configured_count += 1
        else:
            print(f"  {name}: Not configured ({purpose})")

    print(f"\n  {configured_count}/{len(optional_vars)} optional services configured")
    return True


def check_python_dependencies():
    """Check if Python dependencies are installed."""
    print("\n{YELLOW}Python Dependencies:{RESET}")

    required_packages = [
        "fastapi",
        "uvicorn",
        "supabase",
        "langchain",
        "tavily-python",
    ]

    all_installed = True
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"{GREEN}✓{RESET} {package}: Installed")
        except ImportError:
            print(f"{RED}✗{RESET} {package}: Not installed")
            all_installed = False

    return all_installed


def check_virtual_env():
    """Check if running in a virtual environment."""
    print("\n{YELLOW}Virtual Environment:{RESET}")

    if hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
    ):
        print(f"{GREEN}✓{RESET} Running in virtual environment")
        return True
    else:
        print(f"{YELLOW}⚠{RESET} Not running in virtual environment")
        print(f"  {YELLOW}Hint: Activate venv with 'source venv/bin/activate'{RESET}")
        return False


def main():
    """Run all checks."""
    print("=" * 60)
    print("Paparan AI Setup Verification")
    print("=" * 60)

    # Check .env file exists
    env_exists = check_env_file()

    if env_exists:
        # Load environment variables
        load_env()

        # Run checks
        required_ok = check_required_vars()
        llm_ok = check_llm_config()
        check_optional_services()
        deps_ok = check_python_dependencies()
        venv_ok = check_virtual_env()

        # Summary
        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)

        if required_ok and llm_ok:
            print(f"{GREEN}✓{RESET} Core configuration is complete!")
            print(f"\nYou can start the server with:")
            print(f"  {YELLOW}./run.sh{RESET}")
            print(f"  or")
            print(f"  {YELLOW}uvicorn app.main:app --reload --host 0.0.0.0 --port 8000{RESET}")
        else:
            print(f"{RED}✗{RESET} Configuration incomplete!")
            print(f"\nPlease set the required environment variables in .env")
            print(f"See SETUP.md for detailed instructions")

    else:
        print("\n" + "=" * 60)
        print(f"{RED}Setup cannot proceed without .env file{RESET}")
        print("=" * 60)
        print(f"\nTo get started:")
        print(f"  1. Copy .env.example to .env")
        print(f"  2. Fill in your API keys and credentials")
        print(f"  3. Run this script again")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
