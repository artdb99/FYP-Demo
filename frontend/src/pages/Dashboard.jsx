import React, { useState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("diabetes");

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <header className="bg-blue-500 text-white py-4 px-6 rounded-lg mb-6">
        <h1 className="text-xl font-bold">Health Information Hub</h1>
        <p className="text-sm">Evidence-based information for better health</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-start space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("diabetes")}
          className={`${
            activeTab === "diabetes" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          } px-4 py-2 rounded-lg border-2 border-blue-500`}
        >
          Diabetes
        </button>
        <button
          onClick={() => setActiveTab("hypertension")}
          className={`${
            activeTab === "hypertension" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          } px-4 py-2 rounded-lg border-2 border-blue-500`}
        >
          Hypertension
        </button>
        <button
          onClick={() => setActiveTab("cardiovascular")}
          className={`${
            activeTab === "cardiovascular" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          } px-4 py-2 rounded-lg border-2 border-blue-500`}
        >
          Cardiovascular
        </button>
        <button
          onClick={() => setActiveTab("healthyLifestyle")}
          className={`${
            activeTab === "healthyLifestyle" ? "bg-blue-500 text-white" : "bg-white text-blue-500"
          } px-4 py-2 rounded-lg border-2 border-blue-500`}
        >
          Healthy Lifestyle
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "diabetes" && (
        <div className="space-y-6">
          {/* Diabetes Overview */}
          <section className="flex items-center bg-white p-6 rounded-lg shadow-md space-x-6">
            {/* Image Section */}
            <div className="flex-shrink-0 w-1/3">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/5935/5935562.png"
                alt="Diabetes Illustration"
                className="rounded-lg"
              />
            </div>

            {/* Diabetes Overview Text */}
            <div className="w-2/3">
              <h2 className="text-2xl font-semibold mb-4 text-blue-500"><b>Diabetes</b></h2>
              <p>
                Diabetes is a chronic condition that affects how your body turns food into energy. It occurs when your body doesn't make enough insulin or can't use it as well as it should, causing too much sugar to remain in your bloodstream.
              </p>

              {/* Diabetes Stages Cards */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-blue-500"><b>Type 1 Diabetes</b></h3>
                  <p>An autoimmune reaction that stops your body from making insulin.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-blue-500"><b>Type 2 Diabetes</b></h3>
                  <p>Your body doesn’t use insulin well and can’t keep blood sugar at normal levels.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-blue-500"><b>Gestational Diabetes</b></h3>
                  <p>Develops in pregnant women who have never had diabetes.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-blue-500"><b>Prediabetes</b></h3>
                  <p>Blood sugar levels are higher than normal but not high enough for a type 2 diagnosis.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Diabetes */}
          <section className="space-y-6 mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-500"><b>Managing Diabetes</b></h2>
            <div className="space-y-4">

              {/* Monitoring Blood Sugar */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.freepik.com/256/2750/2750349.png?semt=ais_hybrid" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Monitoring Blood Sugar</b></h3>
                    <p>Regular blood sugar monitoring is essential for diabetes management. Your healthcare provider will recommend how often to check your levels.
                      <ul className="list-disc pl-6">
                        <li>Use a blood glucose meter or continuous glucose monitor (CGM)</li>
                        <li>Keep a log of your readings to share with your healthcare team</li>
                        <li>Learn to recognize patterns and how different foods affect your levels</li>
                        <li>Understand your target blood sugar ranges for different times of day</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Medication & Insulin */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/8730/8730553.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Medication & Insulin</b></h3>
                    <p>Depending on your type of diabetes, you may need medication or insulin therapy:
                      <ul className="list-disc pl-6">
                        <li>Type 1 Diabetes: Requires insulin therapy for life, delivered via injections or an insulin pump</li>
                        <li>Type 2 Diabetes: May be managed with oral medications, injectable medications, insulin, or a combination</li>
                        <li>Work closely with your healthcare provider to find the right medication regimen</li>
                        <li>Never adjust your medication without consulting your healthcare team</li>
                      </ul>
                      </p>
                  </div>
                </div>
              </div>

              {/* Diet & Nutrition */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                  <img src="https://www.madison-health.com/content/uploads/2023/04/nutrition-support-madison-health-icon.svg" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Diet & Nutrition</b></h3>
                    <p>A healthy diet is crucial for managing diabetes:
                      <ul className="list-disc pl-6">
                        <li>Focus on a consistent carbohydrate intake and portion control</li>
                        <li>Choose complex carbohydrates with high fiber content</li>
                        <li>Include lean proteins and healthy fats in your meals</li>
                        <li>Limit refined sugars, processed foods, and excessive salt</li>
                        <li>Consider working with a registered dietitian to create a personalized meal plan</li>
                        <li>Learn to count carbohydrates to better manage blood sugar levels</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/11264/11264367.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Physical Activity</b></h3>
                    <p>Regular physical activity helps improve insulin sensitivity and manage blood sugar:
                      <ul className="list-disc pl-6">
                        <li>Aim for at least 150 minutes of moderate-intensity exercise per week</li>
                        <li>Include both aerobic exercise and strength training</li>
                        <li>Start slowly and gradually increase intensity if you're new to exercise</li>
                        <li>Check your blood sugar before, during, and after exercise</li>
                        <li>Carry a fast-acting carbohydrate source during exercise in case of low blood sugar</li>
                        <li>Stay hydrated during physical activity</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "hypertension" && (
        <div className="space-y-6">
          {/* Hypertension Section */}
          <section className="flex items-center bg-white p-6 rounded-lg shadow-md space-x-6">
            <div className="flex-shrink-0 w-1/3">
              <img
                src="https://static.vecteezy.com/system/resources/previews/038/864/528/non_2x/blood-pressure-icon-vector.jpg"
                alt="Hypertension Illustration"
                className="rounded-lg"
              />
            </div>
            <div className="w-2/3">
              <h2 className="text-2xl font-semibold mb-4 text-purple-500"><b>Hypertension</b></h2>
              <p>
                Hypertension, or high blood pressure, is a common condition where the long-term force of blood against your artery walls is high enough that it may eventually cause health problems, such as heart disease.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-purple-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-purple-500"><b>Primary Hypertension</b></h3>
                  <p>Develops gradually over many years with no identifiable cause.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-purple-500"><b>Secondary Hypertension</b></h3>
                  <p>Caused by an underlying condition and appears suddenly.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-purple-500"><b>Blood Pressure Categories</b></h3>
                  <p>Normal: Less than 120/80 mm Hg, Elevated: 120-129/80 mm Hg, Stage 1: 130-139/80-89 mm Hg, Stage 2: 140+/90+ mm Hg</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-purple-500"><b>Risk Factors</b></h3>
                  <p>Age, family history, obesity, sedentary lifestyle, tobacco use, high sodium diet, excessive alcohol, stress, and chronic conditions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Hypertension */}
          <section className="space-y-6 mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-purple-500"><b>Managing Hypertension</b></h2>
            <div className="space-y-4">

              {/* Dietery Approached */}   
              <div className="p-6 bg-white-50 rounded-lg shadow-md">          
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/17864/17864601.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Dietery Approached</b></h3>
                    <p>The DASH (Dietary Approaches to Stop Hypertension) diet is specifically designed to help lower blood pressure:
                      <ul className="list-disc pl-6">
                        <li>Reduce sodium intake to less than 2,300mg per day (ideally 1,500mg)</li>
                        <li>Eat plenty of fruits, vegetables, and whole grains</li>
                        <li>Choose low-fat dairy products, lean meats, and plant proteins</li>
                        <li>Limit foods high in saturated fats and cholesterol</li>
                        <li>Incorporate foods rich in potassium, calcium, and magnesium</li>
                        <li>Reduce intake of sweets, added sugars, and sugar-sweetened beverages</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Medication Management */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/2947/2947762.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Medication Management</b></h3>
                    <p>Many people with hypertension need medication to control their blood pressure:
                      <ul className="list-disc pl-6">
                        <li>Diuretics: Help your kidneys remove excess sodium and water</li>
                        <li>ACE inhibitors: Relax blood vessels by blocking formation of a natural chemical</li>
                        <li>Angiotensin II receptor blockers (ARBs): Block action of a hormone that narrows blood vessels</li>
                        <li>Calcium channel blockers: Prevent calcium from entering heart and blood vessel cells</li>
                        <li>Beta blockers: Reduce workload on your heart and open blood vessels</li>
                        <li>Take medications exactly as prescribed and don't stop without consulting your doctor</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifestyle Modification */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/3664/3664392.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Lifestyle Modification</b></h3>
                    <p>Lifestyle changes can significantly impact blood pressure levels:
                      <ul className="list-disc pl-6">
                        <li>Regular exercise: Aim for 150 minutes of moderate activity weekly</li>
                        <li>Weight management: Even small weight loss can help reduce blood pressure</li>
                        <li>Limit alcohol: No more than one drink daily for women and two for men</li>
                        <li>Quit smoking: Tobacco immediately raises blood pressure and damages vessels</li>
                        <li>Manage stress: Practice relaxation techniques like meditation or deep breathing</li>
                        <li>Limit caffeine: Check if caffeine raises your blood pressure</li>
                        <li>Monitor at home: Regular home monitoring helps track progress</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

                {/* Regular Monitoring */}
                <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                  <div className="flex items-center space-x-4">
                    <img src="https://cdn-icons-png.freepik.com/512/11457/11457856.png" alt="Icon" className="w-20 h-20"/>
                    <div>
                      <h3 className="text-lg font-medium"><b>Regular Monitoring</b></h3>
                      <p>Regular monitoring is essential for managing hypertension:
                        <ul className="list-disc pl-6">
                          <li>Measure your blood pressure at the same time each day</li>
                          <li>Use a properly calibrated and validated device</li>
                          <li>Sit correctly: feet flat, back supported, arm at heart level</li>
                          <li>Take multiple readings and record the results</li>
                          <li>Share your readings with your healthcare provider</li>
                          <li>Attend all scheduled medical appointments</li>
                          <li>Know your target blood pressure goals</li>
                        </ul>
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "cardiovascular" && (
        <div className="space-y-6">
          {/* Cardiovascular Disease Section */}
          <section className="flex items-center bg-white p-6 rounded-lg shadow-md space-x-6">
            <div className="flex-shrink-0 w-1/3">
              <img
                src="https://cdn-icons-png.flaticon.com/512/18228/18228365.png"
                alt="Cardiovascular Illustration"
                className="rounded-lg"
              />
            </div>
            <div className="w-2/3">
              <h2 className="text-2xl font-semibold mb-4 text-red-500"><b>Cardiovascular Disease</b></h2>
              <p>
                Cardiovascular disease (CVD) refers to a group of disorders affecting the heart and blood vessels. These conditions are often related to atherosclerosis, where plaque builds up in the walls of arteries, making it harder for blood to flow through.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-red-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-red-500"><b>Coronary Artery Disease</b></h3>
                  <p>Narrowing of the coronary arteries that supply blood to the heart muscle.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-red-500"><b>Heart Failure</b></h3>
                  <p>When the heart can’t pump blood as well as it should to meet the body’s needs.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-red-500"><b>Stroke</b></h3>
                  <p>Occurs when blood supply to part of the brain is interrupted or reduced.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-red-500"><b>Arrhythmias</b></h3>
                  <p>Abnormal heart rhythms that can affect how well the heart works.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cardiovascular Disease*/}
          <section className="space-y-6 mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-red-500"><b>Managing Cardiovascular Disease</b></h2>
            <div className="space-y-4">

              {/* Heart Healthy Diet */}   
              <div className="p-6 bg-white-50 rounded-lg shadow-md">          
                <div className="flex items-center space-x-4">
                  <img src="https://cdn.iconscout.com/icon/free/png-256/free-healthy-diet-icon-download-in-svg-png-gif-file-formats--nutrition-ketogenic-pack-healthcare-medical-icons-5076264.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Heart Healthy Diet</b></h3>
                    <p>A heart-healthy diet can significantly reduce your risk of cardiovascular disease:
                      <ul className="list-disc pl-6">
                        <li>Emphasize fruits, vegetables, whole grains, and lean proteins</li>
                        <li>Choose healthy fats like olive oil, avocados, nuts, and fatty fish</li>
                        <li>Limit saturated fats, trans fats, and cholesterol</li>
                        <li>Reduce sodium intake to less than 2,300mg daily</li>
                        <li>Minimize added sugars and refined carbohydrates</li>
                        <li>Consider the Mediterranean or DASH diet approaches</li>
                        <li>Stay hydrated with water rather than sugary beverages</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.freepik.com/512/7865/7865982.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Physical Activity</b></h3>
                    <p>Regular physical activity strengthens your heart and improves circulation:
                      <ul className="list-disc pl-6">
                        <li>Aim for at least 150 minutes of moderate-intensity aerobic activity weekly</li>
                        <li>Include muscle-strengthening activities at least twice a week</li>
                        <li>Start slowly and gradually increase intensity if you've been inactive</li>
                        <li>Choose activities you enjoy to help maintain consistency</li>
                        <li>Break up exercise into smaller sessions throughout the day if needed</li>
                        <li>Consider cardiac rehabilitation if you've had a heart attack or procedure</li>
                        <li>Always consult your doctor before starting a new exercise program</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Medication & Treatment */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.freepik.com/512/3724/3724938.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Medication & Treatment</b></h3>
                    <p>Medications and medical procedures may be necessary to manage cardiovascular disease:
                      <ul className="list-disc pl-6">
                        <li><b>Statins</b>: Lower cholesterol levels</li>
                        <li><b>Antiplatelet agents</b>: Prevent blood clots</li>
                        <li><b>Beta-blockers</b>: Reduce heart rate and blood pressure</li>
                        <li><b>ACE inhibitors</b>: Relax blood vessels and lower blood pressure</li>
                        <li><b>Procedures</b>: Angioplasty, stent placement, bypass surgery</li>
                        <li>Take all medications exactly as prescribed</li>
                        <li>Report any side effects to your healthcare provider</li>
                        <li>Never stop taking medications without consulting your doctor</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

                {/* Risk Factor Management */}
                <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                  <div className="flex items-center space-x-4">
                    <img src="https://cdn-icons-png.freepik.com/512/10240/10240365.png" alt="Icon" className="w-20 h-20"/>
                    <div>
                      <h3 className="text-lg font-medium"><b>Risk Factor Management</b></h3>
                      <p>Managing risk factors is crucial for preventing and controlling cardiovascular disease:
                          <ul className="list-disc pl-6">
                            <li><b>Quit smoking:</b> Smoking damages blood vessels and increases risk</li>
                            <li><b>Manage stress:</b> Chronic stress contributes to heart disease</li>
                            <li><b>Control diabetes:</b> High blood sugar damages blood vessels</li>
                            <li><b>Maintain healthy weight:</b> Obesity increases strain on the heart</li>
                            <li><b>Limit alcohol:</b> Excessive drinking raises blood pressure</li>
                            <li><b>Get adequate sleep:</b> Poor sleep is linked to heart disease</li>
                            <li><b>Regular check-ups:</b> Monitor cholesterol, blood pressure, and other risk factors</li>
                          </ul>
                        </p>
                    </div>
                  </div>
                </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "healthyLifestyle" && (
        <div className="space-y-6">
          {/* Healthy Lifestyle Section */}
          <section className="flex items-center bg-white p-6 rounded-lg shadow-md space-x-6">
            <div className="flex-shrink-0 w-1/3">
              <img
                src="https://cdn-icons-png.freepik.com/512/4480/4480052.png"
                alt="Healthy Lifestyle Illustration"
                className="rounded-lg"
              />
            </div>
            <div className="w-2/3">
              <h2 className="text-2xl font-semibold mb-4 text-green-500"><b>Healthy Lifestyle</b></h2>
              <p>
                Adopting a healthy lifestyle is one of the most effective ways to prevent chronic diseases and improve overall well-being. Small, consistent changes can lead to significant health benefits over time.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-green-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-green-500"><b>Balanced Nutrition</b></h3>
                  <p>Eating a variety of nutrient-dense foods provides the energy and nutrients your body needs.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-green-500"><b>Regular Physical Activity</b></h3>
                  <p>Exercise improves cardiovascular health, strengthens muscles, and enhances mental well-being.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-green-500"><b>Stress Management</b></h3>
                  <p>Effective stress management techniques help prevent chronic stress and its negative health effects.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-green-500"><b>Adequate Sleep</b></h3>
                  <p>Quality sleep is essential for physical recovery, cognitive function, and emotional regulation.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Healthy Lifestyle Recommendation */}
          <section className="space-y-6 mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-500"><b>Healthy Lifestyle Recommendation</b></h2>
            <div className="space-y-4">

              {/* Nutrition Guidelines */}   
              <div className="p-6 bg-white-50 rounded-lg shadow-md">          
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/17864/17864601.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Nutrition Guidelines</b></h3>
                    <p>A balanced diet provides the nutrients your body needs while helping maintain a healthy weight:
                      <ul className="list-disc pl-6">
                        <li><b>Fruits and vegetables:</b> Aim for at least 5 servings daily</li>
                        <li><b>Whole grains:</b> Choose whole grains over refined grains</li>
                        <li><b>Lean proteins:</b> Include fish, poultry, beans, nuts, and lean meats</li>
                        <li><b>Healthy fats:</b> Incorporate sources like olive oil, avocados, and nuts</li>
                        <li><b>Dairy or alternatives:</b> Choose low-fat or plant-based options</li>
                        <li><b>Hydration:</b> Drink plenty of water throughout the day</li>
                        <li><b>Limit:</b> Processed foods, added sugars, excessive salt, and unhealthy fats</li>
                        <li><b>Portion control:</b> Be mindful of portion sizes to maintain energy balance</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/2947/2947762.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Physical Activity</b></h3>
                    <p>Regular physical activity offers numerous health benefits:
                      <ul className="list-disc pl-6">
                        <li><b>Aerobic activity:</b> 150-300 minutes of moderate activity or 75-150 minutes of vigorous activity weekly</li>
                        <li><b>Strength training:</b> At least 2 days per week working all major muscle groups</li>
                        <li><b>Flexibility:</b> Incorporate stretching exercises several times weekly</li>
                        <li><b>Balance:</b> Include balance exercises, especially for older adults</li>
                        <li><b>Reduce sitting time:</b> Break up long periods of sitting with short activity breaks</li>
                        <li><b>Start small:</b> If inactive, begin with short sessions and gradually increase</li>
                        <li><b>Find enjoyable activities:</b> Choose activities you like to increase adherence</li>
                        <li><b>Make it social:</b> Exercise with friends or join group activities for motivation</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Stress Management */}
              <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                <div className="flex items-center space-x-4">
                  <img src="https://cdn-icons-png.flaticon.com/512/3664/3664392.png" alt="Icon" className="w-20 h-20"/>
                  <div>
                    <h3 className="text-lg font-medium"><b>Stress Management</b></h3>
                    <p>Effective stress management techniques help prevent chronic stress and its negative health effects:
                      <ul className="list-disc pl-6">
                        <li><b>Mindfulness meditation:</b> Practice being present and aware without judgment</li>
                        <li><b>Deep breathing:</b> Use deep, diaphragmatic breathing to activate relaxation</li>
                        <li><b>Physical activity:</b> Regular exercise helps reduce stress hormones</li>
                        <li><b>Adequate sleep:</b> Prioritize good sleep habits for stress resilience</li>
                        <li><b>Social connections:</b> Maintain supportive relationships</li>
                        <li><b>Time management:</b> Set realistic goals and priorities</li>
                        <li><b>Limit stressors:</b> Identify sources of stress and reduce when possible</li>
                        <li><b>Relaxation techniques:</b> Try progressive muscle relaxation, yoga, or tai chi</li>
                        <li><b>Seek help:</b> Consider professional support when needed</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

                {/* Sleep Hygiene */}
                <div className="p-6 bg-white-50 rounded-lg shadow-md">  
                  <div className="flex items-center space-x-4">
                    <img src="https://cdn-icons-png.freepik.com/512/11457/11457856.png" alt="Icon" className="w-20 h-20"/>
                    <div>
                      <h3 className="text-lg font-medium"><b>Sleep Hygiene</b></h3>
                      <p>Quality sleep is essential for physical recovery, cognitive function, and emotional regulation:
                        <ul className="list-disc pl-6">
                          <li><b>Consistent schedule:</b> Go to bed and wake up at the same time daily</li>
                          <li><b>Create a restful environment:</b> Keep your bedroom dark, quiet, and cool</li>
                          <li><b>Limit screen time:</b> Avoid electronic devices 1-2 hours before bedtime</li>
                          <li><b>Watch diet:</b> Avoid large meals, caffeine, and alcohol close to bedtime</li>
                          <li><b>Physical activity:</b> Regular exercise promotes better sleep</li>
                          <li><b>Relaxation routine:</b> Develop a pre-sleep routine to signal your body</li>
                          <li><b>Manage worries:</b> Write down concerns before bed to clear your mind</li>
                          <li><b>Limit naps:</b> Keep daytime naps short (20-30 minutes) and before 3 PM</li>
                          <li><b>Comfortable bedding:</b> Invest in a supportive mattress and pillows</li>
                        </ul>
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default Dashboard;