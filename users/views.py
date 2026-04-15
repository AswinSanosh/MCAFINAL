from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .forms import CustomUserCreationForm, CustomAuthenticationForm, ProfileUpdateForm
from .models import UserProfile


@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Return CSRF token for frontend forms."""
    return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    """
    Handle user registration.
    Expects: { username, email, password1, password2 }
    """
    if request.method == 'POST':
        try:
            form = CustomUserCreationForm(request.data)
            if form.is_valid():
                user = form.save()
                # Log the user in after registration
                login(request, user)
                # Force session to be saved
                request.session.modified = True
                request.session.save()
                response = Response({
                    'success': True,
                    'message': 'Registration successful',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    }
                }, status=status.HTTP_201_CREATED)
                # Explicitly set the session cookie in the response
                response.set_cookie(
                    key='sessionid',
                    value=request.session.session_key,
                    max_age=1209600,  # 2 weeks
                    httponly=False,
                    samesite='Lax',
                    secure=False,
                )
                return response
            else:
                errors = {}
                for field, field_errors in form.errors.items():
                    errors[field] = [str(e) for e in field_errors]
                return Response({
                    'success': False,
                    'errors': errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("[register_view] Exception:", e)
            traceback.print_exc()
            return Response({
                'success': False,
                'errors': {'form': [f'Internal server error: {str(e)}']}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'error': 'Invalid request method'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Handle user login.
    Expects: { username, password }
    """
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'success': False,
                'errors': {'form': ['Username and password are required']}
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            # Force session to be saved and mark session as modified
            request.session.modified = True
            request.session.save()
            response = Response({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
            # Explicitly set the session cookie in the response
            response.set_cookie(
                key='sessionid',
                value=request.session.session_key,
                max_age=1209600,  # 2 weeks
                httponly=False,  # Allow JS access
                samesite='Lax',
                secure=False,  # Set to True in production with HTTPS
            )
            return response
        else:
            return Response({
                'success': False,
                'errors': {'form': ['Invalid username or password']}
            }, status=status.HTTP_401_UNAUTHORIZED)

    return Response({'error': 'Invalid request method'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout_view(request):
    """Handle user logout."""
    logout(request)
    return Response({
        'success': True,
        'message': 'Logout successful'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile."""
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'bio': profile.bio if profile else None,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        }
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def update_profile_view(request):
    """Update user profile."""
    user = request.user

    # Update user fields
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.save()

    # Update or create profile bio
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.bio = request.data.get('bio', profile.bio)
    profile.save()

    return Response({
        'success': True,
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'bio': profile.bio,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def check_auth_status(request):
    """Check if user is authenticated."""
    if request.user.is_authenticated:
        user = request.user
        profile = getattr(user, 'profile', None)
        return Response({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'bio': profile.bio if profile else None,
            }
        })
    return Response({'authenticated': False})
