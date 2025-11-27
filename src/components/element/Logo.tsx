import { cn } from '@/lib/utils';

export default ({ className, size = 40 }: { className?: string; size?: number }) => (
    <div
        className={cn(
            'flex items-center justify-center rounded-lg',
            className
        )}
    >
        <img 
            src="/logo (1).png" 
            alt="Fixed Asset Management System" 
            className="object-contain"
            style={{ 
                width: size, 
                height: size 
            }}
        />
    </div>
);