"use client"

import { loginSchema, type LoginValues } from "@/app/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { login } from "./actions";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "../../../../components/ui/input";
import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginForm() {
    const [error, setError] = useState<string>();
    const [isPending, startTransition] = useTransition();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: ""
        }
    });

    async function onSubmit(values: LoginValues) {
        setError(undefined);
        startTransition(async () => {
            const { error } = await login(values);
            if(error) setError(error);
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
                        ログイン
                    </LoadingButton>
            </form>
        </Form>
    )
}