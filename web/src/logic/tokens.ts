import Base from '../assets/icons/base.png';
import Celo from '../assets/icons/celo.jpg';
import ETH from '../assets/icons/eth.svg';
import Gnosis from '../assets/icons/gno.svg';
import Matic from '../assets/icons/matic.svg';
import USDT from '../assets/icons/usdt.svg';


export const badgeIcons = [
    { ids: ['84532', '8453'], img: Base },
    { ids: ['11155111', '5', '1'], img: ETH },
    { ids: ['100'], img: 'https://app.safe.global/images/networks/gno.png' },
    { ids: ['42220'], img: Celo },
    { ids: ['1101', '137', '80001'], img: Matic },
    // Add more mappings as needed
  ];


export function getIconForId(id: any) {
    for (const icon of badgeIcons) {
      if (icon.ids.includes(id.toString())) {
        return icon.img;
      }
    }
      // Return a default icon or handle the case when no mapping is found
  return 'defaultIcon';
}


export const tokenList: any = {

  
  11155111: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'ETH',
        image: ETH,
        description: 'Ether currency',
      },                                                                                                    

  ],
  84532: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'ETH',
        image: ETH,
        description: 'Ether currency',
      },                                                                                                    

  ],


}


export  const getTokenInfo = (chainId: number, token: string) => 

{
    try{ 
    if(Object.keys(tokenList).includes(chainId.toString())) {

        return tokenList[chainId].find((item: any) => item.value.toLowerCase() == token?.toLowerCase());

    }
   }
   catch(e) {
       console.log('Error getting token info')
   }
    
    return {};
}

export  const getTokenList = (chainId: number) => 

{
    if(Object.keys(tokenList).includes(chainId.toString())) {

        return tokenList[chainId];

    }
   
    return [];
}