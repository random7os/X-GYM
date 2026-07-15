<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesContractRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'member_name' => 'required|string|max:255',
            'member_email' => 'required|email|max:255',
            'member_phone' => 'required|string|max:20',
            'member_birthdate' => 'nullable|date',
            'membership_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'pt_package_id' => 'nullable|integer',
            'payment_method' => 'required|in:Instapay,Vodafone Cash,Visa,Cash',
            'amount' => 'required|numeric|min:0',
            'member_id' => 'nullable|integer|exists:members,id',
            'renewal_type' => 'nullable|in:renewal',
            'previous_contract_id' => 'nullable|integer|exists:contracts,id',
            'receipt' => 'required_if:payment_method,Instapay|required_if:payment_method,Vodafone Cash|required_if:payment_method,Visa|image|mimes:jpg,jpeg,png|max:5120',
            'id_verification' => 'required|image|mimes:jpg,jpeg,png|max:5120',
        ];
    }
}
