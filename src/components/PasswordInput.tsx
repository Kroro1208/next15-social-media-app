import React, { useState } from "react";
import { Input, type InputProps } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({className, ...props}, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={cn("pe-10", className)}
                    ref={ref}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "パスワードを非表示" : "パスワードを表示する"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                    {showPassword ? (<EyeOff className="size-5"/>) : (<Eye className="size-5"/>)}
                </button>
            </div>
        )
    }
)

PasswordInput.displayName = "PasswaordInput"
export {PasswordInput}