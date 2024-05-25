export const storeAccountInfo = (address: string, chainId: string) => {

    localStorage.setItem('account', JSON.stringify({address: address, chainId: chainId}));
}


export const loadAccountInfo = (): any => {

    const accountInfo = localStorage.getItem('account');
    return accountInfo ? JSON.parse(accountInfo) : {};
}