# from rest_framework import permissions
#
# class IsAdminOrOwner(permissions.BasePermission):
#     """
#     Allow full access to admin users.
#     Normal users can only view or modify their own assigned data.
#     """
#
#     def has_object_permission(self, request, view, obj):
#         # Admin users can do anything
#         if request.user.is_staff:
#             return True
#
#         # Normal user: only access if the assignment belongs to their employee record
#         return hasattr(obj, 'employee') and obj.employee.user == request.user


# from rest_framework import permissions
#
# class AllowAny(permissions.BasePermission):
#     def has_object_permission(self, request, view, obj):
#         # Admin can do anything
#         if request.user and request.user.is_staff:
#             return True
#         # User can only access their own assignment
#         return hasattr(obj, "employee") and obj.employee.user == request.user
