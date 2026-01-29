import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ONetAttribution() {
    return (
        <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
                <div className="text-center mb-3">
                    <a 
                        href="https://www.onetcenter.org/database.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        <img 
                            src="https://www.onetcenter.org/image/link/onet-in-it.svg" 
                            alt="O*NET in-it"
                            className="w-32 h-15 mx-auto border-0"
                        />
                    </a>
                </div>
                <p className="text-xs text-slate-600 text-center">
                    This page includes information from the{" "}
                    <a 
                        href="https://www.onetcenter.org/database.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        O*NET 30.1 Database
                    </a>
                    {" "}by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). 
                    Used under the{" "}
                    <a 
                        href="https://creativecommons.org/licenses/by/4.0/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        CC BY 4.0
                    </a>
                    {" "}license. O*NET® is a trademark of USDOL/ETA.
                </p>
            </CardContent>
        </Card>
    );
}