import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Text,
  Group,
  Input,
  Paper,
  Select,
  useMantineColorScheme,
  Combobox,
  useCombobox,
  InputBase,
  Anchor,
  Alert,
  TextInput,
  Stepper,
  rem,
} from '@mantine/core';
import classes from './Home.module.css';
import ETHIndia from '../../assets/images/ethindia.svg';
import Safe from '../../assets/images/safe.svg';

import { NetworkUtil } from '../../logic/networks';
import { useDisclosure } from '@mantine/hooks';
import { DateTimePicker } from '@mantine/dates';
import {  createSessionKey } from '../../logic/module';
import { ZeroAddress } from 'ethers';

import Confetti from 'react-confetti';
import { IconBrandGithub, IconCoin, IconUserCheck} from '@tabler/icons';


import { useNavigate } from 'react-router-dom';
import { getProvider } from '@/logic/web3';
import { getIconForId, getTokenInfo, getTokenList, tokenList } from '@/logic/tokens';

import {CopyToClipboard} from 'react-copy-to-clipboard';
import { getSafeInfo } from '@/logic/safeapp';
import { formatTime, getTokenBalance } from '@/logic/utils';
import { createPublicClient, formatEther, http } from 'viem';
import { IconBrandTwitterFilled, IconBrandX } from '@tabler/icons-react';
import { RoutePath } from '@/navigation/route-path';

import {
  createPasskeyValidator,
  getPasskeyValidator
} from "@zerodev/passkey-validator"
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless';
import { getWebAuthnDataByAccount } from '@/logic/passkey';


function HomePage() {
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();
  


  const { colorScheme } = useMantineColorScheme();

  const dark = colorScheme === 'dark';

  const [tokenValue, setTokenValue] = useState('0');
  const [safeAccount, setSafeAccount] = useState('');
  const [enableData, setEnableData] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [validAfter, setValidAfter] = useState(Math.floor(Date.now()/1000));
  const [validUntil, setValidUntil] = useState(Math.floor(Date.now()/1000) + 86400);
  const [seletcedToken, setSelectedToken] = useState<string | null>('');

  const [seletcedNetwork, setSelectedNetwork] = useState<string | null>('');
  const [network, setNetwork] = useState('');
  const [chainId, setChainId] = useState(5);

  const [sessionCreated, setSessionCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionKey, setSessionKey] = useState({address: '', privateKey: ''});
  const [signerAccount, setSignerAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [safeError, setSafeError] = useState(false);



  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [value, setValue] = useState<string>("0x0000000000000000000000000000000000000000");
  const [ balance, setBalance ] = useState<any>(0);
  const [active, setActive] = useState(0);

  const selectedOption = getTokenInfo(chainId, value);

  const options = getTokenList(chainId).map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
    image: string
    label: string
    description: string
  }


  function SelectOption({ image, label }: ItemProps) {
    return (
      <Group style={{width: '100%'}}>
        <Avatar src={image} >
        <IconCoin size="1.5rem" />
        </Avatar>
        <div >
          <Text fz="sm" fw={500}>
            {label}
          </Text>
        </div>
      </Group>
    );
  }




  const create = async () => {
    setIsLoading(true);
    try {
      setSessionKey(await createSessionKey(enableData
      ));
      setIsLoading(false);
      setActive(2);
    } catch (e) { 
      console.log(e)
      setIsLoading(false);
      setSafeError(true);
    }
    setSessionCreated(true);
  };


 
  useEffect(() => {
    (async () => {
      const provider = await getProvider();

      const chainId = (await provider.getNetwork()).chainId;

      setChainId(Number(chainId));
      setNetwork(
        `${NetworkUtil.getNetworkById(Number(chainId))?.name}`
      );

      try {
        const safeInfo = await getSafeInfo();
        setSafeAccount(safeInfo?.safeAddress);
        if(value == ZeroAddress) {
        setBalance(parseFloat(formatEther(await provider.getBalance(safeInfo?.safeAddress))).toFixed(4))
        } else {
        setBalance(await getTokenBalance(value, safeInfo?.safeAddress, provider))
        }
        }
        catch(e)
        {
          console.log('No safe found')
        }
        
    })();
  }, [value]);

  return (
    <>
    <div>      

            <h1 className={classes.heading}>Add PassKey to your
            <div className={classes.safeContainer}>
            <img
            className={classes.safe}
            src={Safe}
            alt="avatar"
            />
        </div>
        </h1>
        </div>
        <>
      <div className={classes.homeContainer}>
    <Paper className={classes.formContainer} shadow="md" withBorder radius="md" p="xl" >
        { !Object.keys(tokenList).includes(chainId.toString()) && <Alert variant="light" color="yellow" radius="lg" title="Unsupported Network">
      Safe PassKey App supports only these networks as of now <b> : <br/> {Object.keys(tokenList).map((chainId) => `${NetworkUtil.getNetworkById(Number(chainId))?.name} ${NetworkUtil.getNetworkById(Number(chainId))?.type}, `)} </b>
    </Alert> }

    { safeError && <Alert variant="light" color="yellow" radius="lg" title="Open as Safe App">

     Try this application as a <span/>
      <Anchor href="https://app.safe.global/share/safe-app?appUrl=https://safe-passkey.zenguard.xyz&chain=sep">
      Safe App
        </Anchor> <span/>
        on Safe Wallet.
      
    </Alert> }


        <div className={classes.inputContainer}>

        <Stepper size="sm" active={active} onStepClick={setActive} color='green' >
        <Stepper.Step label="Add PassKey" description="Signer for your account" icon={<IconUserCheck style={{ width: rem(18), height: rem(18) }} />}>

              <div
                style={{
                  // display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  marginBottom: '20px',
                  alignItems: 'center',
                }}
              >
              
            <p className={classes.topHeading}>
              Add PassKey auth to your Safe <Anchor target='_blank' href={`/#/account?account=${safeAccount}`}>here </Anchor> 
            </p>


              </div>

        


            <Button
              size="lg" 
              radius="md"   
              fullWidth
              color="green"
              className={classes.btn}
              onClick={async () => {


                setIsLoading(true);
                const webAuthnData = await getWebAuthnDataByAccount(safeAccount);
               
                if(webAuthnData.length) {

                  setEnableData(webAuthnData[0].enable_data)
                  setActive(1);
                }
                setIsLoading(false);
                }}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              loading={isLoading}
            >
            Next  </Button>
            <br/>


        </Stepper.Step>
        <Stepper.Step label="Add Module" description="Enable the module">
        <div className={classes.inputContainer}>
            

            </div> 

            <Button
              size="lg" radius="md" 
              fullWidth
              color="green"
              className={classes.btn}
              onClick={create}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              loading={isLoading}
            >
              {isLoading ? 'Adding PassKey ...' : 'Add PassKey'}
            </Button>
            <br/>

            <p className={classes.subHeading}>
              Just execute this transaction to enable passkey for your Safe ✨
            </p>
        </Stepper.Step>
        <Stepper.Step label="All Set" description="Confirmation">
        <div>

              <h1 className={classes.heading}>PassKey Account is Ready!</h1>

              <p className={classes.subheading} style={{ textAlign: 'center' }}>
                
               This passkey account is like a magic wand. Check out the magic of passkey <Anchor onClick={() => navigate(RoutePath.account)}>here </Anchor> ❤️ ❤️
              </p>

              <div className={classes.actions}>
            
            <Button size="lg" radius="md"
              onClick={() => setActive(0)}
             style={{ width: '180px' }}        
                color={ dark ? "#49494f" : "#c3c3c3" } 
                variant={ "filled" } 
               >Create New</Button>
        
          </div>


          </div>
        </Stepper.Step>
        <Stepper.Completed>
          Completed, click back button to get to previous step
        </Stepper.Completed>
      </Stepper>

      </div> 
          
    </Paper>
          
        </div>
     
        </>
      
             
             <div className={classes.avatarContainer}>

            <Group className={classes.mode}>
            {/* <Group className={classes.container} position="center"> */}
            <IconBrandX 
            size={30}
            stroke={1.5}
            onClick={() => window.open("https://x.com/zenguardxyz")}
            style={{ cursor: 'pointer' }}
            />
            <IconBrandGithub
            size={30}
            stroke={1.5}
            onClick={() => window.open("https://github.com/koshikraj/safe-passkey-validator")}
            style={{ cursor: 'pointer' }}
            />

            {/* </Group> */}
            {/* </Group> */}
            </Group>
            </div>
    </>
  );
}

export default HomePage;

// show dropdown. no model. list all token
