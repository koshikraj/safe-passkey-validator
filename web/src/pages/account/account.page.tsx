import { Text, ActionIcon, Alert, Anchor, Avatar, Badge, Button, CopyButton, Divider, Input, Modal, Paper, Popover, rem, Tooltip, InputBase, Combobox, useCombobox, Group, TextInput, Skeleton, Stepper, Timeline, Code, ThemeIcon, Progress, Stack } from '@mantine/core';
import classes from './account.module.css';
import { useEffect, useState } from 'react';
import useLinkStore from '@/store/account/account.store';
import { formatEther, parseEther, parseUnits, ZeroAddress } from 'ethers';
import { buildTransferToken, fixDecimal, formatTime, getTokenBalance, getTokenDecimals, passkeyHttpClient, publicClient } from '@/logic/utils';
import { useDisclosure } from '@mantine/hooks';
import {  IconBug, IconCheck, IconChevronDown, IconClock, IconCoin, IconConfetti, IconCopy, IconCross, IconDownload, IconError404, IconGif, IconGift, IconHomeDown, IconSend, IconShieldCheck, IconTransferOut, IconUserCheck } from '@tabler/icons';
import { NetworkUtil } from '@/logic/networks';
import Confetti from 'react-confetti';
import { getIconForId, getTokenInfo, getTokenList, tokenList } from '@/logic/tokens';
import { getJsonRpcProvider } from '@/logic/web3';

import { getWebAuthn, sendTransaction } from '@/logic/module';
import { loadAccountInfo, storeAccountInfo } from '@/utils/storage';


import Passkey from '../../assets/icons/passkey.svg';
import { useSearchParams } from 'react-router-dom';
import { addWebAuthnData, create, getWebAuthnData, getWebAuthnDataByAccount, login } from '@/logic/passkey';
import { get } from 'http';
import { waitForExecution } from '@/logic/permissionless';




export const AccountPage = () => {


  
  const { authDetails, setAuthDetails, chainId, setChainId, setConfirming, confirming} = useLinkStore((state: any) => state);
  const [searchParams, setSearchParams] = useSearchParams();

  const [ balance, setBalance ] = useState<any>(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [sendModal, setSendModal] = useState(false);
  const [tokenValue, setTokenValue] = useState(0);

  const [walletName, setWalletName] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sendLoader, setSendLoader] = useState(false);
  const [userDetails, setUserDetails] = useState({name:'', wallet:'', type: 'wallet'});
  const [refreshing, setRefreshing ] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [value, setValue] = useState<string>("0x0000000000000000000000000000000000000000");
  const [walletProvider, setWalletProvider] = useState<any>();
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionKeyActive, setSessionKeyActive] = useState(false);
  const [error, setError ] = useState('');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [passkeyAuth, setPasskeyAuth] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);


  const availableTestChains = Object.keys(tokenList).filter(chainId => NetworkUtil.getNetworkById(
    Number(chainId)
  )?.type == 'testnet').map(
    (chainId: string) => 
    ({label: `${NetworkUtil.getNetworkById(Number(chainId))?.name}`, type: `${NetworkUtil.getNetworkById(
      Number(chainId)
    )?.type}`, image: getIconForId(chainId), value: chainId }))

    const availableMainnetChains = Object.keys(tokenList).filter(chainId => NetworkUtil.getNetworkById(
      Number(chainId)
    )?.type == 'mainnet').map(
      (chainId: string) => 
      ({label: `${NetworkUtil.getNetworkById(Number(chainId))?.name}`, type: `${NetworkUtil.getNetworkById(
        Number(chainId)
      )?.type}`, image: getIconForId(chainId), value: chainId }))
  
  
  const mainnetOptions = availableMainnetChains.map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  const testnetOptions = availableTestChains.map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} />
    </Combobox.Option>
  ));

  const options = (<Combobox.Options>
          <Combobox.Group >
            {mainnetOptions}
          </Combobox.Group>

          <Combobox.Group label="TESTNETS">
          {testnetOptions}
          </Combobox.Group>
        </Combobox.Options>)

  const chainCombobox = useCombobox({
    onDropdownClose: () => chainCombobox.resetSelectedOption(),
  });
  const tokenCombobox = useCombobox({
    onDropdownClose: () => tokenCombobox.resetSelectedOption(),
  });

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


  const selectedToken = getTokenInfo(chainId, value);

  const tokenOptions = getTokenList(chainId).map((item: any) => (
    <Combobox.Option value={item.value} key={item.value}>
      <TokenOption {...item} />
    </Combobox.Option>
  ));

  interface TokenProps extends React.ComponentPropsWithoutRef<'div'> {
    image: string
    label: string
    description: string
  }

   
  function TokenOption({ image, label }: TokenProps) {
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

  async function sendAsset() {

    setSendLoader(true);
    setSendSuccess(false);
    setError('');
    try {


    let parseAmount, data='0x', toAddress = sendAddress ;
    if(value == ZeroAddress) {
            parseAmount = parseEther(tokenValue.toString());
        } else {
          const provider = await getJsonRpcProvider(chainId.toString())
            parseAmount = parseUnits(tokenValue.toString(), await  getTokenDecimals(value, provider))
            data = await buildTransferToken(value, toAddress, parseAmount, provider)
            parseAmount = 0n;
            toAddress = value;
        }
    const result = await sendTransaction(chainId.toString(), toAddress, parseAmount, walletProvider, authDetails?.account)
    if (!result)
    setSendSuccess(false);
    else {
    setSendSuccess(true);
    setSendModal(false);
    setConfirming(true);
    await waitForExecution(chainId, result);
    setConfirming(false);

    }
    
    
  } catch(e) {
    console.log('Something went wrong!', e)
    setSendLoader(false);  
    setError('Oops! Gremlins have invaded your transaction. Please try again later.');
  }  
  setSendLoader(false);

  }

  async function fetchValidatorData() {

    setSessionLoading(true);

    console.log(await getWebAuthn(chainId, authDetails?.account))

    const validatorActive = (await getWebAuthn(chainId, authDetails?.account))[0]!=0n

    console.log(validatorActive)

    setOnboardingStep(validatorActive ? 2 : 1)

    setSessionLoading(false);

    setBalanceLoading(true);
    const provider = await getJsonRpcProvider(chainId.toString());

    if(value == ZeroAddress) {
      setBalance(formatEther(await provider.getBalance(authDetails?.account)))
      } else {
      setBalance(await getTokenBalance(value, authDetails?.account?.address , provider))
      }

    setBalanceLoading(false);
  
  }

  console.log(chainId)

  useEffect(() => {
    (async () => {


      console.log('authDetails')

      const wallet = loadAccountInfo();
      const account = searchParams.get('account') || wallet.address;
      const nchainId = searchParams.get('chainId') ? searchParams.get('chainId') : chainId;

      storeAccountInfo(account, nchainId);
      setChainId(nchainId);
      setAuthDetails({ account: account, chainId: chainId})

    
    })();
  }, []);


  useEffect(() => {
    (async () => {

      if(!authDetails.account) {
        open();
      }

      setBalanceLoading(true);
      const provider = await getJsonRpcProvider(chainId.toString());
  
      if(value == ZeroAddress) {
        setBalance(formatEther(await provider.getBalance(authDetails?.account)))
        } else {
        setBalance(await getTokenBalance(value, authDetails?.account?.address , provider))
        }
  
      setBalanceLoading(false);
      
      window.addEventListener('resize', () => setDimensions({ width: window.innerWidth, height: window.innerHeight }));
      
    })();
  }, [ chainId, sendSuccess, value, confirming, sendLoader, authDetails]);


  
  function shortenAddress(address: any) {
    const start = address.slice(0, 7);
    const end = address.slice(-5);
    return `${start}...${end}`;
  }
  return (
    <>
      <Modal opened={passkeyAuth} onClose={()=> setPasskeyAuth(false)} title="Authenticate your Account" centered>

<div className={classes.formContainer}>
      <div>
        <h1 className={classes.heading}>Authenticate in one click with PassKey</h1>
      </div>
      <p className={classes.subHeading}>
        Register using a new PassKey?
      </p>
      <div className={classes.accountInputContainer}>
      
       <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >
        <Input.Wrapper >
          <Input
            type="text"
            size="lg" 
            value={walletName}
            onChange={(event: any) => setWalletName(event.currentTarget.value)}
            placeholder="Wallet Name"
            className={classes.input}
          />
        </Input.Wrapper>
    
      <Button
        type="button"
        variant="outline"
        size="lg" radius="md" 
        fullWidth
        color="green"
        style={{
          marginLeft: "20px"}}
        onClick={ async() => { 

        try {  
        setAuthenticating(true); 
        
        const passkeyValidator =  await create(walletName, chainId)

        if(!(await getWebAuthnDataByAccount(authDetails.account)).length) {
        await addWebAuthnData(authDetails.account, await passkeyValidator.getEnableData())
        }

        setWalletProvider(passkeyValidator)
        setOnboardingStep(1); 
        fetchValidatorData();
        setPasskeyAuth(false);
        setAuthenticating(false); 
      }
      catch(e) {
        setAuthenticating(false);
      }
      }}
        
      
      >
      Create
      </Button>
      </div>

      <Divider my="xs" label="OR" labelPosition="center" />

      <p className={classes.subHeading}>
       Already used a PassKey?
      </p>

        
      <div
          style={{
            display: 'flex',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
            justifyContent: 'center',

          }}
        >
          
      <Button
        size="lg" radius="md" 
        type="button"
        fullWidth
        color="green"
        className={classes.btn}
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        onClick={ async() => { 
          
        setAuthenticating(true); 
          
        try {  
        const passkeyValidator =  await login(chainId)

        if(!(await getWebAuthnDataByAccount(authDetails.account)).length) {
        await addWebAuthnData(authDetails.account, await passkeyValidator.getEnableData())
        }


        setWalletProvider(passkeyValidator)
        setOnboardingStep(1); 
        fetchValidatorData();
        setPasskeyAuth(false);
        setAuthenticating(false); 
        } 
        catch(e) {
          console.log(e)
          setAuthenticating(false);
        }
        }}
        loading={ authenticating}
      >
      Login
      </Button>
      </div>   
      </div>
    </div>
  
</Modal>

  <Modal  overlayProps={{
          backgroundOpacity: 0.55,
          blur: 7}} size={600} opened={opened && !passkeyAuth} onClose={close} title="Authenticate your Account" centered>

  <div className={classes.formContainer} >
      <div>
        <h1 className={classes.heading}>Add PassKey for your Safe</h1>
      </div>


      <div className={classes.accountInputContainer}>
      {<Timeline
      active={onboardingStep} 
      bulletSize={30} 
      lineWidth={1}
      color='green'
    >
      <Timeline.Item
        bullet={<IconUserCheck style={{ width: rem(18), height: rem(18) }} />}
        title="Authenticate your account"
      
      >

      { onboardingStep >= 1 && <Group
        
          style={{
            display: 'flex',
            marginTop: '20px',
            gap: '20px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >

      <Group wrap="nowrap">
        <Avatar
          src={ Passkey }
          size={50}
          radius="md"
        />

        <div>


          <Group wrap="nowrap" gap={10} mt={3}>
          <CopyButton value={userDetails?.wallet} timeout={1000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <Text fz="xs" c="dimmed">
            {shortenAddress(userDetails?.wallet)}
            </Text>
          </Group>

        </div>
      </Group>

      <Button
        size="sm" 
        radius="md" 
        variant="outline"
        color="red"
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        onClick={ async() => {  
        try { 
          setOnboardingStep(0);
        } 
        catch(e) {
        }
        }}
       >
      Disconnect
      </Button>

      </Group> }

      { onboardingStep == 0 &&
      <Stack>
      <Text fz="sm" fw={500} className={classes.name}  c="dimmed">
        Authenticate with any of the below methods
        </Text>
        <Group>
      <Button size='lg' variant="default" radius='md' onClick={ ()=> setPasskeyAuth(true)}>
      <Avatar src={Passkey} size='md'  />
      </Button>


      </Group>
      </Stack> }


 

      </Timeline.Item>
      <Timeline.Item
        bullet={<IconShieldCheck style={{ width: rem(18), height: rem(18) }} />}
        title="Connect Safe Account"
      >

  
          { onboardingStep == 2 && 


            <Group
            style={{
              display: 'flex',
              marginTop: '20px',
              gap: '20px',
              marginBottom: '20px',
              alignItems: 'center',
              // justifyContent: 'center',

            }}
          >
           <Group wrap="nowrap">
           <Avatar
             src="https://pbs.twimg.com/profile_images/1643941027898613760/gyhYEOCE_400x400.jpg"
             size={50}
             radius="md"
           />
   
             <Group wrap="nowrap" gap={10} mt={3}>
             <CopyButton value={userDetails?.wallet} timeout={1000}>
                 {({ copied, copy }) => (
                   <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                     <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                       {copied ? (
                         <IconCheck style={{ width: rem(16) }} />
                       ) : (
                         <IconCopy style={{ width: rem(16) }} />
                       )}
                     </ActionIcon>
                   </Tooltip>
                 )}
               </CopyButton>
               <Text fz="lg" c="dimmed">
               {shortenAddress(authDetails.account)}
               </Text>
             </Group>
         </Group>
         </Group>
          }

          { !sessionKeyActive && onboardingStep==1 && 
          
        <div>

        <Text fz="sm" fw={500} className={classes.name}  c="dimmed">
          Finish module installation on Safe App and continue here
        </Text>

        <br/>


        { sessionLoading && <>
              <Skeleton style={{marginBottom: '10px'}} height={20} width={200} mt={6} radius="xl" /> 
                  <Skeleton style={{marginBottom: '20px'}} height={20}  mt={6} radius="xl" /> 
              </>
              }


          <Button
            size="sm" 
            radius="md" 
            variant="outline"
            // fullWidth
            color="green"
            // className={classes.btn}
            loaderProps={{ color: 'white', type: 'dots', size: 'sm' }}
            onClick={ async() => {  
              setRefreshing(true);
              await fetchValidatorData(); 
              setRefreshing(false);
              
            }}
            loading={refreshing}
          >
          Continue
          </Button>

          

      </div>

            }
    </Timeline.Item>
    </Timeline>
    }


      <div
          style={{
            display: 'flex',
            marginTop: '20px',
            marginBottom: '20px',
            alignItems: 'center',
            justifyContent: 'center',

          }}
        >



      <Button
        size="lg" 
        radius="md"         
        fullWidth
        className={onboardingStep < 2 ?  "" : classes.btn}
        disabled={onboardingStep < 2}
        loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
        onClick={ async() => { 
          
        try {  

        close();
        } 
        catch(e) {
        }
   
        }}
      >
      Continue
      </Button>


      </div>   
      </div>
    </div>
  
</Modal>

<Modal opened={sendModal} onClose={()=>{ setSendModal(false); setSendSuccess(false); setValue(ZeroAddress);}} title="Transfer your crypto" centered>

<div className={classes.formContainer}>
      <div>
        <h1 className={classes.heading}>Send crypto anywhere</h1>
      </div>
      <p className={classes.subHeading}>
        Send your crypto gas free.
      </p>
      <div className={classes.inputContainer}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  alignItems: 'center',
                }}
              >
                  <Combobox
                        store={tokenCombobox}
                        withinPortal={false}
                        onOptionSubmit={(val) => {
                          setValue(val);
                          tokenCombobox.closeDropdown();
                        }}
                      >
                        <Combobox.Target>
                          <InputBase
                          style={{width: '50%'}}
                            component="button"
                            type="button"
                            pointer
                            rightSection={<Combobox.Chevron />}
                            onClick={() => tokenCombobox.toggleDropdown()}
                            rightSectionPointerEvents="none"
                            multiline
                          >
                            {selectedToken ? (
                              <TokenOption {...selectedToken} />
                            ) : (
                              <Input.Placeholder>Pick Token</Input.Placeholder>
                            )} 
                          </InputBase>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                          <Combobox.Options>{tokenOptions}</Combobox.Options>
                        </Combobox.Dropdown>
                      </Combobox>

             
                <Input
                  style={{ width: '40%'}}
                  type="number"
                  size='lg'
                  value={tokenValue}
                  onChange={(e: any) => setTokenValue(e?.target?.value)}
                  placeholder="Value"
                  className={classes.input}
                />
                


              </div>
              <Text size="sm" style={{cursor: 'pointer'}} onClick={()=>{ setTokenValue(balance)}}>
              { balanceLoading ? <Skeleton height={15} width={90} mt={6} radius="xl" /> : `Balance: ${balance} ${getTokenInfo(chainId, value)?.label}` } 
              </Text>

              <Input
                  type="string"
                  style={{ marginTop: '20px'}}
                  size='lg'
                  value={sendAddress}
                  onChange={(e: any) => setSendAddress(e?.target?.value)}
                  placeholder="Recipient Address"
                  className={classes.input}
                />

            </div>
            
              <Button
              size="lg" radius="md" 
              style={{marginBottom: '20px'}}
              fullWidth
              color="green"
              className={classes.btn}
              onClick={async () => 
                await sendAsset()}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              loading={sendLoader}
            >
              Send Now
            </Button>


      { sendSuccess && <Alert variant="light" color="lime" radius="md" title="Transfer Successful" icon={<IconConfetti/>}>
      Your crypto assets have safely landed in the Success Galaxy. Buckle up for a stellar financial journey! 🚀💰
    </Alert>
      }

{ error && <Alert variant="light" color="red" radius="md" title="Transfer Error" icon={<IconBug/>}>
      {error}
    </Alert>
      }
            
    </div>
  
</Modal>

    <Paper className={classes.accountContainer} shadow="md" withBorder radius="md" p="xl" >
      
      <div className={classes.formContainer}>
        <div className={classes.avatarContainer}>
          <img
            className={classes.avatar}
            src="https://pbs.twimg.com/profile_images/1643941027898613760/gyhYEOCE_400x400.jpg"
            alt="avatar"
            height={100}
            width={100}
          />
           <div className={classes.balanceContainer}>
         <Anchor href={`${NetworkUtil.getNetworkById(Number(chainId))?.blockExplorer}/address/${authDetails.account}`} target="_blank" underline="hover">  <p> { shortenAddress( authDetails.account ? authDetails.account : ZeroAddress)}</p>
          </Anchor>
          <CopyButton value={authDetails.account} timeout={1000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            </div>




                   <Combobox
                        store={chainCombobox}
                        withinPortal={false}
                        onOptionSubmit={(val) => {
                          setChainId(val);
                          chainCombobox.closeDropdown();
                        }}
                      >
                        <Combobox.Target>
                        <Badge
                                pl={0}
                                style={{ cursor: 'pointer', width: '200px', height: '40px', padding: '10px'}} 
                                
                                color="gray"
                                variant="light"
                                leftSection={
                                  <Avatar alt="Avatar for badge" size={24} mr={5} src={getIconForId(chainId)} />
                                }
                                rightSection={
                                  <IconChevronDown size={20} />
                                }
                                size="lg"
                                // className={classes.network}
                                // checked={false}
                                onClick={() => chainCombobox.toggleDropdown()}
                              > 
                                {`${NetworkUtil.getNetworkById(Number(chainId))?.name}`}
                </Badge>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                          <Combobox.Options>{options}</Combobox.Options>
                        </Combobox.Dropdown>
                      </Combobox>


          <p className={classes.balance}>  { balanceLoading ? <Skeleton height={20} width={110} mt={6} radius="xl" /> : `${fixDecimal(balance, 4)} ${getTokenInfo(chainId, ZeroAddress).label}` }   </p>
          

          
        </div>

        <div className={classes.actionsContainer}>

      
          <div className={classes.actions}>
            <Button size="lg" radius="md" style={{ width: '110px' }} className={classes.btn} color="teal" onClick={()=> setSendModal(true)}>
              Send
            </Button>
            <Button size="lg" radius="md"
                color={ "#49494f" }
                disabled
                variant={ "filled" } 
                style={{
                  // backgroundColor: "#20283D"
                }}>Swap</Button>
          </div>
        </div>
      </div>
    </Paper>
    </>
  );
};