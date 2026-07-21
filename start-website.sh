#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
echo "Luxury Proposal Website"
echo "Open http://localhost:8080 in your browser."
python3 -m http.server 8080
