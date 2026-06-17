import "./About.css";
import theo from "../assets/theo.png";
import lloyd from "../assets/lloyd.jpg";
import jasper from "../assets/jasper.jpg";
import dustin from "../assets/dus.png";

function About() {
    return (
        <main className="about-page">
            <section className="about-hero">
                <h1>About Our Operating Systems Simulator</h1>
                <p>
                    Our Operating Systems Simulator is a web-based learning platform
                    designed to help students understand key operating system concepts
                    through interactive simulations and visualizations.
                </p>
            </section>

            <section className="about-grid">
                <div className="about-card">
                    <h2>CPU Scheduling</h2>
                    <p>
                        Explore FCFS, SJF, Priority Scheduling, and Round Robin while
                        viewing average waiting time and turnaround time.
                    </p>
                </div>

                <div className="about-card">
                    <h2>Virtual Memory</h2>
                    <p>
                        Learn how memory is managed when physical memory is limited and how
                        page handling affects system performance.
                    </p>
                </div>

                <div className="about-card">
                    <h2>Mass Storage</h2>
                    <p>
                        Understand how operating systems organize storage and improve data
                        access, performance, and efficiency.
                    </p>
                </div>

                <div className="about-card">
                    <h2>Purpose</h2>
                    <p>
                        This platform provides a practical and visual way to test
                        algorithms, observe results, and compare different methods.
                    </p>
                </div>

                <div className="about-card full">
                    <h2>Our Goal</h2>
                    <p>
                        Our goal is to make learning Operating Systems easier, more
                        engaging, and more accessible for students.
                    </p>
                </div>
            </section>

            <section className="team-section">
                <h2 className="team-title">MEET THE KUPALS</h2>

                <div className="team-grid">

                    <div className="team-card">
                        <img src={lloyd} alt="Lloyd" />
                        <h3>Lloyd Rodney Z. Arevalo</h3>
                    </div>

                    <div className="team-card">
                        <img src={jasper} alt="Jasper" />
                        <h3>Jasper Martin A. Gabriel</h3>
                    </div>

                    <div className="team-card">
                        <img src={theo} alt="Theo" />
                        <h3>Altheo Evans Mananquil</h3>
                    </div>

                    <div className="team-card">
                        <img src={dustin} alt="Dustin" />
                        <h3>Dustin S. Ong</h3>
                    </div>

                </div>
            </section>
                 
     
        </main>
    );
}

export default About;