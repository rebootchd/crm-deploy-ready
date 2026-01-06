from django import forms
from .models import Lead

class LeadForm(forms.ModelForm):
    class Meta:
        model = Lead
        fields = ['name', 'email', 'phone', 'source', 'qualified', 'assigned_to']

    def __init__(self, *args, **kwargs):
        super(LeadForm, self).__init__(*args, **kwargs)
        self.fields['qualified'] = forms.ChoiceField(
            choices=[(True, 'Yes'), (False, 'No')],
            widget=forms.RadioSelect,
            label='Qualified'
        )