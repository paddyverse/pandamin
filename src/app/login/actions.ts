'use server';

export async function verifyPinAction(pin: string): Promise<boolean> {
    const correctPin = process.env.DASHBOARD_PIN;

    if (!correctPin) {
        throw new Error('DASHBOARD_PIN is not configured on the server.');
    }

    return pin === correctPin;
}
