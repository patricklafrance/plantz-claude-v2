import { useState } from "react";

import { Button, DatePicker, Label, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@packages/components";
import type { PlanningStrategy } from "@packages/core-plants/vacation";

interface VacationDateFormProps {
    onGenerate: (startDate: Date, endDate: Date, strategy: PlanningStrategy) => void;
    disabled?: boolean;
    initialStartDate?: Date;
    initialEndDate?: Date;
    initialStrategy?: PlanningStrategy;
}

export function VacationDateForm({ onGenerate, disabled = false, initialStartDate, initialEndDate, initialStrategy = "balanced" }: VacationDateFormProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);
    const [strategy, setStrategy] = useState<PlanningStrategy>(initialStrategy);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleGenerate = () => {
        const newErrors: Record<string, string> = {};

        if (!startDate) {
            newErrors.startDate = "Start date is required";
        }

        if (!endDate) {
            newErrors.endDate = "End date is required";
        }

        if (startDate && endDate && endDate <= startDate) {
            newErrors.endDate = "End date must be after start date";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            return;
        }

        setErrors({});
        onGenerate(startDate!, endDate!, strategy);
    };

    return (
        <div className="border-border bg-card flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="start-date">Start Date</Label>
                    <DatePicker id="start-date" value={startDate} onChange={setStartDate} placeholder="Trip start" disabled={disabled} aria-describedby={errors.startDate ? "start-date-error" : undefined} />
                    {errors.startDate && (
                        <p id="start-date-error" className="text-destructive text-xs" role="alert">
                            {errors.startDate}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="end-date">End Date</Label>
                    <DatePicker id="end-date" value={endDate} onChange={setEndDate} placeholder="Trip end" disabled={disabled} aria-describedby={errors.endDate ? "end-date-error" : undefined} />
                    {errors.endDate && (
                        <p id="end-date-error" className="text-destructive text-xs" role="alert">
                            {errors.endDate}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="strategy">Planning Strategy</Label>
                    <Select value={strategy} onValueChange={(val) => setStrategy(val as PlanningStrategy)}>
                        <SelectTrigger id="strategy" className="w-[200px]">
                            <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="conservative">Conservative</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="minimal-intervention">Minimal Intervention</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleGenerate} disabled={disabled}>
                    Generate Forecast
                </Button>
            </div>
        </div>
    );
}
