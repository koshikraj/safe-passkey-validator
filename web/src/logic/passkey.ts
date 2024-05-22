import { createPasskeyValidator, getPasskeyValidator } from "@zerodev/passkey-validator";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { createPublicClient, http } from "viem";


const SUPABASE_URL = 'https://tpklnjqgdqeneuffftoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa2xuanFnZHFlbmV1ZmZmdG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYzNzIzMzcsImV4cCI6MjAzMTk0ODMzN30.ct0pbteTEcm11Kg-U1o6ox-jIfdJg-lgb7yh8u35XOc';

const BUNDLER_URL =
"https://rpc.zerodev.app/api/v2/bundler/ec9a8985-9972-42d4-9879-15e21e4fe3b6"

const publicClient = createPublicClient({
  transport: http(BUNDLER_URL)
})

const PASSKEY_SERVER_URL = 'https://passkeys.zerodev.app/api/v3/68dd147b-b325-408c-aa55-77a14e8b5f1d'


export async function login() {

  
  return await getPasskeyValidator(publicClient, {
        passkeyServerUrl: PASSKEY_SERVER_URL,
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}

export async function create(username: string) {
    // Logic for passkey registration
   

        return await createPasskeyValidator(publicClient, {
        passkeyName: username,
        passkeyServerUrl: 'https://passkeys.zerodev.app/api/v3/68dd147b-b325-408c-aa55-77a14e8b5f1d',
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}


export async function getWebAuthnData() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function getWebAuthnDataByAccount(account: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn?account=eq.${account}`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function addWebAuthnData(account: string, enableData: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn`, {
     method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ account: account, enable_data: enableData}),
    });
    const data = await response.json();
    return data;
  }