# forms.py
from django import forms
from django.core.mail import send_mail
try:
    from settings import EMAIL_HOST_USER
except ImportError:
    print "must set EMAIL_HOST_USER in settings_local.py to send emails"
    EMAIL_HOST_USER = ""

class ContactForm(forms.Form):
    email = forms.CharField(required=False, label="Your email (optional):")
    message = forms.CharField(widget=forms.Textarea, required=False)

    def send_email(self):
        return_email = self.cleaned_data['email']
        msg = self.cleaned_data['message']
        subject, to_email = 'Metacademy feedback from ' + return_email, 'feedback@metacademy.org'
        try:
            send_mail(subject, msg, EMAIL_HOST_USER, [to_email], fail_silently=False)
        except:
            print "Unable to send feedback message"

