// Generated by https://quicktype.io

export interface SuscriptionPayResponse {
    id:                   string;
    payer_id:             number;
    payer_email:          string;
    back_url:             string;
    collector_id:         number;
    application_id:       number;
    status:               string;
    reason:               string;
    date_created:         string;
    last_modified:        string;
    init_point:           string;
    preapproval_plan_id:  string;
    auto_recurring:       AutoRecurring;
    summarized:           Summarized;
    next_payment_date:    string;
    payment_method_id:    string;
    card_id:              string;
    first_invoice_offset: null;
}

export interface AutoRecurring {
    frequency:                number;
    frequency_type:           string;
    transaction_amount:       number;
    currency_id:              string;
    start_date:               string;
    billing_day:              number;
    billing_day_proportional: boolean;
    has_billing_day:          boolean;
    free_trial:               null;
}

export interface Summarized {
    quotas:                  null;
    charged_quantity:        null;
    pending_charge_quantity: null;
    charged_amount:          null;
    pending_charge_amount:   null;
    semaphore:               null;
    last_charged_date:       null;
    last_charged_amount:     null;
}

// Generated by https://quicktype.io

export interface SearchSuscriptionPlansResponse {
    paging:  Paging;
    results: Result[];
}

export interface Paging {
    offset: number;
    limit:  number;
    total:  number;
}

export interface Result {
    reason:         string;
    status:         string;
    subscribed:     number;
    back_url:       string;
    auto_recurring: AutoRecurring;
    collector_id:   number;
    init_point:     string;
    date_created:   string;
    id:             string;
    last_modified:  string;
    application_id: number;
}

export interface AutoRecurring {
    frequency:          number;
    currency_id:        string;
    transaction_amount: number;
    frequency_type:     string;
    billing_day:        number;
}
