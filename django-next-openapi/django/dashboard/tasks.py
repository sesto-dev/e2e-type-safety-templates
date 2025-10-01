from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

@shared_task
def send_celery_email(candidate_email, subject, plain_text, html_content=None):
    msg = EmailMultiAlternatives(subject=subject, body=plain_text, from_email=settings.EMAIL_HOST_USER, to=[candidate_email])
    if html_content:
        msg.attach_alternative(html_content, "text/html")
    msg.send()
