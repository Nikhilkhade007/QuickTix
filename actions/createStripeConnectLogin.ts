"use server";
import { stripe } from "@/lib/stripe";

export async function createStripeConnectLink(stipeAccountId:string) {
    if (!stipeAccountId){
        throw new Error("No stripe account Id provided")
    }

    try{
        const loginLink = await stripe.accounts.createLoginLink(stipeAccountId);
        return loginLink.url;
    }catch(error){
        console.error("Error creating Stripe connect login link:",error)
        throw new Error("Failed to create stripe connect login link")
    }
}