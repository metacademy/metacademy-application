from django import template

register = template.Library()

@register.filter
def subtract(a, b):
    return a - b
