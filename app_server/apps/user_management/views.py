from django.shortcuts import render_to_response, redirect
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render

def user_main(request):
    if not request.user.is_authenticated():
        return redirect('/user/login?next=%s' % request.path)
    return render_to_response('user.html')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect("/user")
    else:
        form = UserCreationForm()
    return render(request, "register.html", {
        'form': form,
    })


