export interface ValidatorState {
    moniker: string;
    status: string;
}

export interface ValidatorResponse {
    validators: Array<{
        operator_address: string;
        description: {
            moniker: string;
        };
        status: string;
    }>;
}
