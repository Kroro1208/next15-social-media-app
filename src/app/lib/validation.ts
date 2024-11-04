import { z } from "zod";

const requiredString = z.string().trim().min(1, "必須項目です")

export const signUpSchema = z.object({
    email: requiredString.email("無効なメールアドレスです"),
    usename: requiredString.regex(
        /^[a-zA-Z0-9_-]+$/,
        "文字,数字と_(アンダースコア)及び-(ハイフン)のみ入力可能です"
    ),
    password: requiredString.min(8, "最低8文字以上入力してください")
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
    username: requiredString,
    password: requiredString
})

export type LoginValues = z.infer<typeof loginSchema>;