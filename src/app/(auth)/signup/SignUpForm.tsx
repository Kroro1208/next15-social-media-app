"use client"
import { signUpSchema, type SignUpValues } from "@/app/lib/validation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "../../../../components/ui/input";
import { useState, useTransition } from "react";
import { signUp } from "./action";
import { PasswordInput } from "@/components/PasswordInput";
import LoadingButton from "@/components/LoadingButton";


export default function SignUpForm() {
    const [error, setError] = useState<string>();
    const [isPending, startTransition] = useTransition();
    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            username: "",
            password: ""
        }
    });

    async function onSubmit(values: SignUpValues) {
        setError(undefined);
        startTransition(async() => {
            const {error} = await signUp(values);
            if(error) setError(error)
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                {error && <p className="text-center text-destructive">{error}</p>}
                <FormField
                    control={form.control}
                    name="username"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                <FormControl>
                                    <Input placeholder="ユーザー名" {...field}/>
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                <FormControl>
                                    <Input placeholder="メールアドレスを入力" type="email" {...field}/>
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder="パスワードを入力" {...field}/>
                                </FormControl>
                            </FormLabel>
                        </FormItem>
                    )}
                />
                <LoadingButton loading={isPending} type="submit" className="w-full">
                    アカウント作成
                </LoadingButton>
            </form>
        </Form>
    )
}