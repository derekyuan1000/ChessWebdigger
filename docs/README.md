# Chess Webdigger Documentation

## Introduction

Chess Webdigger is a web application designed to help chess players find their online usernames across popular chess platforms like Chess.com and Lichess. The application uses intelligent search algorithms to identify potential matches based on name patterns, FIDE ratings, federation information, and other available data.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Usage Guide](#usage-guide)
4. [Technical Architecture](#technical-architecture)
5. [API Reference](#api-reference)
6. [Opening Analysis](#opening-analysis)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Troubleshooting](#troubleshooting)

## Features

- **Username Search**: Find usernames across Chess.com and Lichess using a player's full name
- **Multi-Criteria Search**: Refine searches with FIDE ID, Federation, FIDE Rating, and Birth Year
- **Confidence Scoring**: Results display with confidence scores to indicate match probability
- **Game Statistics**: View game counts for each found player
- **Opening Analysis**: Analyze the opening repertoire of found players
- **Interactive Chess Board**: Explore openings with a full-featured interactive board
- **Federation Matching**: Smart federation matching to account for variations in country codes
- **Rating Comparisons**: Intelligent rating comparison across different platforms

## Installation

### Prerequisites

- Node.js (v18 or higher)
- NPM (v6 or higher)

### Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/username/chess-webdigger.git
   cd chess-webdigger
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Access the application at:
   ```
   http://localhost:3000
   ```

## Usage Guide

### Basic Search

1. Enter a chess player's full name in the "Full Name" field (this is required)
2. Click "Find Usernames" to search across chess platforms
3. View results displayed with confidence scores and user information

### Advanced Search

For more accurate results, include additional information:

- **FIDE ID**: Enter the player's FIDE ID number for exact matching
- **Federation**: Enter the player's chess federation (e.g., USA, RUS, NOR)
- **FIDE Rating**: Enter the player's approximate FIDE rating
- **Birth Year**: Enter the player's birth year

### Understanding Results

Results are presented in two sections - Chess.com and Lichess matches:

- **Confidence Score**: Indicates the likelihood of a correct match (High, Medium, Low)
- **Matched Criteria**: Shows which search criteria were matched
- **Federation**: Player's reported federation/country
- **Rating**: Player's current rating on the platform
- **Last Active**: When the player was last active on the platform

### Analyzing Opening Repertoires

1. After searching, select players from the search results
2. Click "Analyze Openings" to view the selected players' chess repertoires
3. Use the interactive chess board to explore common positions and variations
4. View statistics about move frequency and top continuations

## Technical Architecture

### Frontend

- **Technologies**: Vanilla JavaScript, HTML5, CSS3
- **Libraries**: Chess.js (chess logic), Chessboard.js (interactive board)
- **Features**: Responsive design, interactive analysis tools, dynamic content loading

### Backend

- **Technologies**: Node.js, Express.js
- **API Integrations**: Chess.com API, Lichess API, FIDE data
- **Search Algorithm**: Intelligent pattern matching with confidence scoring
- **Caching**: Game data caching to improve performance

### Data Flow

1. User submits search criteria via the web interface
2. Server generates name patterns and search queries
3. APIs are queried in parallel (Chess.com and Lichess)
4. Results are processed, scored, and organized
5. Frontend displays results and enables further analysis

## API Reference

### Internal APIs

#### POST /api/search

Search for player usernames across platforms.

**Request Body:**
```json
{
  "name": "Magnus Carlsen",
  "fide": "1503014",
  "federation": "NOR",
  "ratings": "2855",
  "birthYear": "1990"
}
```

**Response:**
```json
{
  "chesscom": [
    {
      "username": "MagnusCarlsen",
      "confidence": 95,
      "matchedCriteria": ["Name pattern", "Federation", "Very Similar Rating"],
      "federation": "NOR",
      "rating": 2850,
      "lastOnline": "6/15/2025"
    }
  ],
  "lichess": [
    {
      "username": "DrNykterstein",
      "confidence": 90,
      "matchedCriteria": ["FIDE ID Match", "Federation", "Similar Rating"],
      "federation": "NOR",
      "rating": 2863,
      "lastOnline": "6/20/2025"
    }
  ]
}
```

#### GET /api/player-games

Get game count for a specific player.

**Query Parameters:**
- `username`: Player's username
- `platform`: Platform name (chess.com or lichess)

**Response:**
```json
{
  "count": 1532
}
```

#### GET /api/openingtree/playerGames

Get opening repertoire data for a player.

**Query Parameters:**
- `site`: Platform name (chess.com or lichess)
- `player`: Player's username
- `literate`: Whether to include additional metadata
- `limit`: Number of games to analyze

**Response:**
```json
{
  "games": [...],
  "totalGames": 1532
}
```

### External APIs Used

- **Chess.com API**: https://www.chess.com/news/view/published-data-api
- **Lichess API**: https://lichess.org/api
- **FIDE Data**: https://ratings.fide.com

## Opening Analysis

The opening analysis feature allows you to:

1. **Compare repertoires** across multiple players
2. **Visualize moves** on the interactive board
3. **View statistics** about position frequency
4. **Discover top continuations** from current positions
5. **Explore variations** by making moves on the board

### Understanding the Analysis Interface

- **Board**: Interactive chess board showing the current position
- **Move List**: List of moves played with frequency statistics
- **Position Stats**: Information about the current position including frequency and best continuations
- **Board Controls**: Navigate through the moves, flip the board orientation

## Deployment

Chess Webdigger is configured for easy deployment on Render.com using the included `render.yaml` file.

### Render.com Deployment

1. Create a Render.com account
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` configuration
4. Deploy the service with default settings

### Manual Deployment

1. Set up a Node.js environment (v18+)
2. Clone the repository
3. Install dependencies: `npm install`
4. Set environment variables:
   - `PORT`: Port number for the server (default: 3000)
5. Start the server: `npm start`

## Contributing

Contributions to Chess Webdigger are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to your branch: `git push origin new-feature`
5. Submit a pull request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation to reflect changes
- Ensure all tests pass before submitting pull requests

## Troubleshooting

### Common Issues

#### Search returns no results

- Ensure the player's name is spelled correctly
- Try using different variations of the name
- Add additional search criteria like FIDE ID or federation

#### Opening analysis shows no data

- Verify that the player has games on the selected platform
- Check if the OpeningTree API service is available
- Try limiting the analysis to fewer players

#### Performance issues

- Reduce the number of concurrent player analyses
- Clear your browser cache
- Try a different browser

### Support

For additional support or to report issues, please:

1. Check the [GitHub Issues](https://github.com/username/chess-webdigger/issues) page
2. Submit a new issue with detailed information about the problem
3. Include browser console logs and steps to reproduce the issue

---

© 2025 Chess Webdigger. All rights reserved.
