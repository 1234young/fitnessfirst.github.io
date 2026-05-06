
import './WelcomeMarquee.css';

export default function WelcomeMarquee(){
    return (
        <div className="welcome-marquee">
          <div className="welcome-track">
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>

            {/* duplicate for seamless loop */}
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
            <span>WELCOME</span>
          </div>
        </div>
    )
}