import { auth } from "@/lib/auth";
import { fakerTR as faker } from '@faker-js/faker';

const TIMES = 11;

for (let i = 0; i < TIMES; i++) {
    await auth.api.signUpEmail({
        body: {
            email: faker.internet.email(),
            name: faker.person.firstName(),
            password: "annen3169"
        }
    })
    console.log(`Hesap ${i+1} oluşturuldu`)
}