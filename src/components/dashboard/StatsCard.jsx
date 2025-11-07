import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const colorClasses = {
    blue: {
        bg: "from-blue-500 to-blue-600",
        icon: "bg-blue-500/20 text-blue-600",
        trend: "text-blue-600"
    },
    green: {
        bg: "from-green-500 to-green-600", 
        icon: "bg-green-500/20 text-green-600",
        trend: "text-green-600"
    },
    purple: {
        bg: "from-purple-500 to-purple-600",
        icon: "bg-purple-500/20 text-purple-600", 
        trend: "text-purple-600"
    },
    orange: {
        bg: "from-orange-500 to-orange-600",
        icon: "bg-orange-500/20 text-orange-600",
        trend: "text-orange-600"
    }
};

export default function StatsCard({ title, value, icon: Icon, color, trend }) {
    const colorClass = colorClasses[color] || colorClasses.blue;
    
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-r ${colorClass.bg} rounded-full opacity-10`} />
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                                {value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl ${colorClass.icon}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={`flex items-center text-sm font-medium ${colorClass.trend}`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {trend}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}