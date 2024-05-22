export const storeAccountInfo = (address: string) => {

    localStorage.setItem('account', JSON.stringify({address: address}));
}


export const loadAccountInfo = (): any => {

    const accountInfo = localStorage.getItem('account');
    return accountInfo ? JSON.parse(accountInfo) : {};
}