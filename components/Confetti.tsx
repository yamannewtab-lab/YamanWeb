import React, { useRef, useEffect } from 'react';

const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#f59e0b', '#fb923c', '#ffffff', '#d4d4d8']; // amber-500, orange-400, white, gray-300
        const numConfetti = 150;
        const confetti: any[] = [];

        for (let i = 0; i < numConfetti; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height, // Start above screen
                w: Math.random() * 8 + 5, // width
                h: Math.random() * 6 + 5, // height
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: Math.random() * 4 - 2, // horizontal velocity
                vy: Math.random() * 3 + 2, // vertical velocity
                angle: Math.random() * Math.PI * 2,
                angularVelocity: Math.random() * 0.1 - 0.05,
            });
        }
        
        let startTime: number | null = null;
        const duration = 7000; // 7 seconds

        const draw = (time: number) => {
            if (startTime === null) {
                startTime = time;
            }
            const elapsedTime = time - startTime;
            
            if (elapsedTime > duration) {
                 if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                }
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetti.forEach(c => {
                c.y += c.vy;
                c.x += c.vx;
                c.angle += c.angularVelocity;

                // Reset confetti that goes off screen to the top
                if (c.y > canvas.height + 20) {
                    c.x = Math.random() * canvas.width;
                    c.y = -20;
                }
                if (c.x > canvas.width + 20) {
                    c.x = -20;
                }
                if (c.x < -20) {
                    c.x = canvas.width + 20;
                }

                ctx.save();
                ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
                ctx.rotate(c.angle);
                ctx.fillStyle = c.color;
                ctx.globalAlpha = 1 - (elapsedTime / duration); // Fade out effect
                ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
                ctx.restore();
            });

            animationFrameId.current = requestAnimationFrame(draw);
        };

        animationFrameId.current = requestAnimationFrame(draw);

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 100
            }}
        />
    );
};

export default Confetti;
