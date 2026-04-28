# Django Backend Integration Guide

This guide covers integrating your Oraka PWA/Desktop App with the Django backend.

## 🔗 Backend Configuration

### 1. CORS Settings (Django)

Add to your Django `settings.py`:

```python
# For local development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",       # Alternative dev port
    "app://oraka",                 # Electron app
]

# For production
CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
    "app://oraka",  # Electron app
]

# Allow credentials (for authentication)
CORS_ALLOW_CREDENTIALS = True

# Install django-cors-headers if not present
# pip install django-cors-headers
```

Add to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]
```

Add to `MIDDLEWARE`:
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

### 2. API Versioning Header

Detect if requests come from PWA or Electron:

```python
# views.py or middleware.py
def get_app_source(request):
    """Returns: 'web', 'pwa', 'electron', or 'unknown'"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    app_source = request.META.get('HTTP_X_APP_SOURCE', '')
    
    if app_source == 'electron':
        return 'electron'
    elif app_source == 'pwa':
        return 'pwa'
    elif 'Electron' in user_agent:
        return 'electron'
    else:
        return 'web'

# Use in views to track app usage
class OrderViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        app_source = get_app_source(request)
        # Log or use for analytics
        print(f"Order created from {app_source}")
        return super().create(request, *args, **kwargs)
```

### 3. Offline Data Sync

For handling offline orders/inventory updates:

```python
# models.py - Add sync tracking
class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    # ... other fields
    synced_at = models.DateTimeField(auto_now=True)
    is_synced = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']

class InventorySync(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    change_log = models.JSONField()
    synced = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

Handle sync batches:

```python
# api/views.py - Sync endpoint for offline updates
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def sync_offline_data(request):
    """
    Receive batch of offline changes and sync to database
    """
    changes = request.data.get('changes', [])
    results = []
    
    for change in changes:
        if change['type'] == 'order':
            order = Order.objects.create(**change['data'])
            results.append({
                'id': change['id'],
                'synced': True,
                'server_id': str(order.id)
            })
        elif change['type'] == 'inventory':
            # Handle inventory update
            pass
    
    return Response({'synced': results})
```

### 4. Authentication & Tokens

Configure authentication for PWA/Desktop:

```python
# settings.py - JWT or Token authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # or
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

# Token refresh for desktop app
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
```

Use in frontend:

```javascript
// Frontend API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/token/refresh/', { refresh });
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (err) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📡 WebSocket Support (Real-time Updates)

### Django Channels Setup

```bash
pip install channels channels-redis
```

```python
# settings.py
INSTALLED_APPS = [
    'daphne',  # Must be first
    # ... other apps
]

ASGI_APPLICATION = 'your_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    }
}
```

```python
# asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from myapp import routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
```

WebSocket consumer for real-time inventory/order updates:

```python
# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.tenant = self.user.tenant
        self.group_name = f'tenant_{self.tenant.id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def inventory_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'inventory_update',
            'data': event['data']
        }))
    
    async def order_created(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_created',
            'data': event['data']
        }))
```

Frontend connection:

```javascript
// hooks/useWebSocket.js
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications/`);
    
    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
    };
    ws.onclose = () => setConnected(false);
    
    return () => ws.close();
  }, []);
  
  return { connected };
}
```

---

## 🔐 Rate Limiting & Throttling

Protect API from abuse:

```bash
pip install djangorestframework-simplejwt
```

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

## 📊 Logging & Monitoring

Track app usage:

```python
# models.py
from django.contrib.admin.models import LogEntry

class AppUsageLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    app_source = models.CharField(max_length=20)  # web, pwa, electron
    app_version = models.CharField(max_length=20, null=True)
    action = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['app_source', 'created_at']),
        ]

# views.py
def log_usage(request, action):
    app_source = request.META.get('HTTP_X_APP_SOURCE', 'web')
    app_version = request.META.get('HTTP_X_APP_VERSION')
    
    AppUsageLog.objects.create(
        user=request.user,
        app_source=app_source,
        app_version=app_version,
        action=action
    )
```

---

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Django
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev

# Browser: http://localhost:5173
```

### Production Setup

```bash
# Build frontend
cd frontend
npm run build

# Configure Django to serve frontend
STATIC_ROOT = '/var/www/oraka/static'
STATIC_URL = '/static/'

# Collect static files
python manage.py collectstatic

# Serve with Gunicorn + Nginx
gunicorn config.wsgi --bind 0.0.0.0:8000
```

### Docker (Optional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Build frontend
COPY frontend/ frontend/
RUN cd frontend && npm install && npm run build

# Copy Django
COPY . .

# Run migrations and collect static
RUN python manage.py migrate
RUN python manage.py collectstatic --noinput

# Start Django
CMD ["gunicorn", "config.wsgi", "--bind", "0.0.0.0:8000"]
```

---

## 🔗 Environment Variables

Frontend `.env`:
```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

Django `.env`:
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgresql://user:pass@localhost/oraka
```

---

## ✅ Integration Checklist

- [ ] CORS configured in Django
- [ ] JWT/Token authentication working
- [ ] API versioning headers set
- [ ] Offline sync endpoint created
- [ ] WebSocket setup (optional)
- [ ] Rate limiting configured
- [ ] Usage logging implemented
- [ ] Frontend API client configured
- [ ] Authentication tokens stored securely
- [ ] Deployment environment set up

---

## 📞 Common Issues & Solutions

### CORS Error?
```python
# Django settings.py
CORS_ALLOW_ALL_ORIGINS = True  # Dev only!
# Or list specific origins in CORS_ALLOWED_ORIGINS
```

### 401 Unauthorized?
- Check token is sent in Authorization header
- Verify token not expired (implement refresh)
- Clear localStorage and re-login

### WebSocket Connection Fails?
- Install `daphne` and configure `ASGI_APPLICATION`
- Check Redis is running (if using RedisChannelLayer)
- Verify WebSocket URL is correct

### Electron App Can't Connect?
- Check `CORS_ALLOWED_ORIGINS` includes `app://oraka`
- Ensure `CSRF_TRUSTED_ORIGINS` updated
- Add app origin to `X-APP-SOURCE` header detection

