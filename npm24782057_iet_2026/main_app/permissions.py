from rest_framework import permissions


class IsCitizen(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return getattr(request.user, 'is_member', not getattr(request.user, 'is_admin', False))


class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.reporter == request.user and obj.status == 'DRAFT'