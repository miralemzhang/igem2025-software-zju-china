from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

def amplify_layer_model(t, y, kf1, kr1, kf2, kr2):
    P, A, Dop, PA, A_Dop = y
    dP_dt = -kf1 * P * A + kr1 * PA
    dA_dt = -kf1 * P * A + kr1 * PA - kf2 * A * Dop + kr2 * A_Dop
    dDop_dt = -kf2 * A * Dop + kr2 * A_Dop
    dPA_dt = kf1 * P * A - kr1 * PA
    dA_Dop_dt = kf2 * A * Dop - kr2 * A_Dop
    return [dP_dt, dA_dt, dDop_dt, dPA_dt, dA_Dop_dt]

@app.route('/api/amplify-layer', methods=['POST'])
def amplify_layer():
    data = request.get_json()
    try:
        A_total = float(data.get('A_total', 12.5))
        Dop_total = float(data.get('Dop_total', 1.0))
        pollutant_concentrations = data.get('pollutant_concentrations', [0, 10, 50, 100, 500])
        pollutant_concentrations = [float(x) for x in pollutant_concentrations]
        kf1 = float(data.get('kf1', 0.1))
        kr1 = float(data.get('kr1', 0.01))
        kf2 = float(data.get('kf2', 0.5))
        kr2 = float(data.get('kr2', 0.05))
        T = float(data.get('T', 100))
        t_span = [0, T]
        t_eval = np.linspace(t_span[0], t_span[1], 200)

        plt.figure(figsize=(10, 6))
        plt.title('Amplify Layer: Active DNA Template vs. Time')
        plt.xlabel('Time (seconds)')
        plt.ylabel('Active DNA Template [D_op] (nM)')
        plt.grid(True, linestyle='--', alpha=0.6)

        for P0 in pollutant_concentrations:
            y0 = [P0, A_total, Dop_total, 0, 0]
            sol = solve_ivp(
                amplify_layer_model,
                t_span,
                y0,
                args=(kf1, kr1, kf2, kr2),
                t_eval=t_eval,
                dense_output=True
            )
            plt.plot(sol.t, sol.y[2], label=f'Pollutant = {P0} nM')

        plt.legend()
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close()
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        return jsonify({
            'status': 'success',
            'image_base64': img_base64,
            'message': 'done',
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 