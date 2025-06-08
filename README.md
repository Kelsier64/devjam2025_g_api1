# Study Abroad Advisor AI

A FastAPI-based application that helps students find and apply to graduate programs abroad using Google Gemini AI. The system provides personalized school recommendations and application deadline tracking.

## Features

- **Conversational AI Advisor**: Guides students through a structured conversation to collect relevant information for school matching
- **Personalized School Recommendations**: Ranks schools based on student profile and preferences
- **Application Calendar**: Tracks important application deadlines and events
- **User Authentication**: Secure login and registration with JWT tokens
- **Web Interface**: Simple HTML templates for interacting with the system

## Technology Stack

- **Backend**: FastAPI
- **AI**: Google Gemini 2.5 Flash (via OpenAI compatibility API)
- **Authentication**: JWT
- **Database**: In-memory (development), can be extended to SQL/NoSQL
- **Frontend**: HTML, Jinja2 Templates

## Installation

1. Clone the repository
2. Create a `.env` file with your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

Start the server with:

```bash
python main.py
```

The application will be available at http://localhost:8080

## API Endpoints

### Authentication
- `POST /token` - Login and get JWT token
- `POST /register` - Register a new user

### User Interaction
- `POST /chat` - Chat with the AI advisor
- `POST /check` - Generate application calendar for selected schools
- `GET /calendar` - View application calendar

### Web Pages
- `GET /` - Home page
- `GET /login` - Login page
- `GET /chat` - Chat interface

## Project Structure

- `main.py` - FastAPI application and routes
- `models.py` - Pydantic models for data validation
- `database.py` - Database utilities (currently in-memory)
- `requirements.txt` - Project dependencies
- `templates/` - HTML templates for web pages
- `static/` - Static assets (CSS, JS, images)

## AI Agents

The system uses multiple AI agents:

1. **Profile Agent**: Guides the conversation to collect student information
2. **Ranking Agent**: Evaluates and ranks schools based on student profiles
3. **Calendar Agent**: Generates application deadlines and events

## Future Enhancements

- Persistent database integration
- Enhanced UI/UX
- Email notifications for deadlines
- Document upload and management for applications
- Integration with actual school application portals

## License

[MIT License](https://opensource.org/licenses/MIT)