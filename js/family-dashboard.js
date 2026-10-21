let selectedChildForTransfer = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Only normal accounts can monitor child accounts
  if (!await requireAuth('normal')) return;

  const parentId = localStorage.getItem('paymoney_user_id');
  if (!parentId) return;

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  document.getElementById('parentTransferForm').addEventListener('submit', handleParentTransfer);
  document.getElementById('closeParentTransferModal').addEventListener('click', closeParentTransferModal);
  document.getElementById('cancelParentTransfer').addEventListener('click', closeParentTransferModal);
  document.getElementById('parentTransferModal').addEventListener('click', event => {
    if (event.target.id === 'parentTransferModal') closeParentTransferModal();
  });

  await loadFamilyData(parentId);
});

async function loadFamilyData(parentId) {
  const container = document.getElementById('liteAccountsList');
  
  try {
    // 1. Fetch all child accounts connected to this parent
    const { data: children, error: childError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, phone, upi_id, wallet_balance, age')
      .eq('parent_id', parentId)
      .eq('account_type', 'lite');

    if (childError) throw childError;

    if (!children || children.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="color: #64748b; margin-bottom: 10px;">No Lite Accounts found</h3>
          <p style="color: #94a3b8; font-size: 0.95rem;">You have not connected any PayMoney Lite accounts for your children yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = ''; // Clear loading

    // 2. Render each child account and fetch their transactions
    for (const child of children) {
      const card = document.createElement('div');
      card.className = 'lite-account-card';
      
      const header = document.createElement('div');
      header.className = 'lite-account-header';
      header.innerHTML = `
        <h3>
          <span style="background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">LITE</span>
          ${child.full_name}
        </h3>
      `;

      const balanceRow = document.createElement('div');
      balanceRow.className = 'lite-balance-row';

      const balance = document.createElement('div');
      balance.className = 'lite-balance';
      balance.textContent = `₹${parseFloat(child.wallet_balance).toFixed(2)}`;

      const sendMoneyButton = document.createElement('button');
      sendMoneyButton.type = 'button';
      sendMoneyButton.className = 'btn btn-primary send-child-money-btn';
      sendMoneyButton.textContent = 'Send Money';
      sendMoneyButton.addEventListener('click', () => openParentTransferModal(child));

      balanceRow.appendChild(balance);
      balanceRow.appendChild(sendMoneyButton);
      
      const details = document.createElement('div');
      details.style.marginBottom = '16px';
      details.style.fontSize = '0.9rem';
      details.style.color = '#475569';
      details.innerHTML = `
        <strong>Mobile:</strong> ${child.phone} &nbsp;|&nbsp; <strong>UPI ID:</strong> ${child.upi_id}
      `;

      const txContainer = document.createElement('div');
      txContainer.className = 'lite-transactions-container';
      txContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.9rem; padding: 20px;">Loading transactions...</p>`;

      card.appendChild(header);
      card.appendChild(balanceRow);
      card.appendChild(details);
      card.appendChild(txContainer);
      container.appendChild(card);

      // Fetch transactions for this specific child
      fetchChildTransactions(child.id, txContainer);
    }
    
  } catch (err) {
    console.error('Error loading family data:', err);
    container.innerHTML = `<p style="color: red; text-align: center;">Failed to load accounts. Please try again later.</p>`;
  }
}

function openParentTransferModal(child) {
  selectedChildForTransfer = child;
  document.getElementById('parentTransferTitle').textContent = `Send money to ${child.full_name}`;
  document.getElementById('parentTransferAmount').value = '';
  document.getElementById('parentTransferModal').style.display = 'block';
  document.getElementById('parentTransferAmount').focus();
}

function closeParentTransferModal() {
  document.getElementById('parentTransferModal').style.display = 'none';
  document.getElementById('parentTransferForm').reset();
  selectedChildForTransfer = null;
}

async function handleParentTransfer(event) {
  event.preventDefault();
  const child = selectedChildForTransfer;
  const amountText = document.getElementById('parentTransferAmount').value.trim();
  const amount = Number(amountText);

  if (!child || !amountText || !Number.isFinite(amount) || amount <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(amountText)) {
    showNotification('Enter a valid amount with up to 2 decimal places', 'error');
    return;
  }

  const parent = await getProfile(true);
  if (!parent) {
    showNotification('Could not verify your account. Please log in again.', 'error');
    return;
  }

  if (amount > Number(parent.wallet_balance)) {
    showNotification('Insufficient wallet balance', 'error');
    return;
  }

  const submitButton = document.getElementById('confirmParentTransfer');
  submitButton.disabled = true;
  submitButton.textContent = 'Checking...';

  try {
    await requireUpiVerification(amount, async () => {
      const { data: freshParent, error: parentError } = await supabaseClient
        .from('profiles')
        .select('id, wallet_balance')
        .eq('id', parent.id)
        .single();
      if (parentError) throw parentError;

      const { data: freshChild, error: childError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, wallet_balance')
        .eq('id', child.id)
        .eq('parent_id', parent.id)
        .eq('account_type', 'lite')
        .single();
      if (childError) throw childError;

      const parentBalance = Number(freshParent.wallet_balance);
      const childBalance = Number(freshChild.wallet_balance);
      if (amount > parentBalance) throw new Error('Insufficient wallet balance');

      const newParentBalance = parentBalance - amount;
      const newChildBalance = childBalance + amount;

      const { data: parentUpdate, error: parentUpdateError } = await supabaseClient
        .from('profiles')
        .update({ wallet_balance: newParentBalance })
        .eq('id', parent.id)
        .eq('wallet_balance', parentBalance)
        .select('id')
        .maybeSingle();
      if (parentUpdateError) throw parentUpdateError;
      if (!parentUpdate) throw new Error('Your wallet balance changed. Please try again.');

      const { data: childUpdate, error: childUpdateError } = await supabaseClient
        .from('profiles')
        .update({ wallet_balance: newChildBalance })
        .eq('id', child.id)
        .eq('parent_id', parent.id)
        .eq('account_type', 'lite')
        .eq('wallet_balance', childBalance)
        .select('id')
        .maybeSingle();

      if (childUpdateError || !childUpdate) {
        const { error: refundError } = await supabaseClient
          .from('profiles')
          .update({ wallet_balance: parentBalance })
          .eq('id', parent.id)
          .eq('wallet_balance', newParentBalance);
        if (refundError) {
          console.error('Failed to restore parent balance after child credit failed:', refundError);
          throw new Error('Child account could not be credited and the parent balance could not be restored. Please contact support.');
        }
        if (childUpdateError) throw childUpdateError;
        throw new Error('Child account balance changed. The payment was cancelled and your balance restored.');
      }

      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert([{
          sender_id: parent.id,
          receiver_id: child.id,
          amount,
          transaction_type: 'peer_to_peer',
          description: `Parent transfer to ${freshChild.full_name}`
        }]);

      if (transactionError) {
        const { error: childRefundError } = await supabaseClient
          .from('profiles')
          .update({ wallet_balance: childBalance })
          .eq('id', child.id)
          .eq('wallet_balance', newChildBalance);
        const { error: parentRefundError } = await supabaseClient
          .from('profiles')
          .update({ wallet_balance: parentBalance })
          .eq('id', parent.id)
          .eq('wallet_balance', newParentBalance);

        if (childRefundError || parentRefundError) {
          console.error('Failed to roll back transfer after transaction record insert failed:', {
            childRefundError,
            parentRefundError
          });
          throw new Error('The transfer record could not be saved and the balances could not both be restored. Please contact support.');
        }
        throw transactionError;
      }

      closeParentTransferModal();
      await loadFamilyData(parent.id);
    });
  } catch (error) {
    console.error('Parent-to-child transfer failed:', error);
    showNotification(error.message || 'Could not send money to the child account', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Continue to PIN';
  }
}

async function fetchChildTransactions(childId, txContainer) {
  try {
    const { data: transactions, error } = await supabaseClient
      .from('transactions')
      .select('*, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)')
      .or(`sender_id.eq.${childId},receiver_id.eq.${childId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      txContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:0.9rem; padding: 20px;">No recent transactions found for this account.</p>`;
      return;
    }

    txContainer.innerHTML = '<h4 style="margin-bottom: 12px; color: #334155; font-size: 0.95rem;">Recent Activity</h4>';
    
    transactions.forEach(tx => {
      const isSender = tx.sender_id === childId;
      const otherPartyName = isSender 
        ? (tx.receiver ? tx.receiver.full_name : 'Unknown') 
        : (tx.sender ? tx.sender.full_name : 'Unknown');
        
      const title = (tx.transaction_type === 'recharge' || tx.transaction_type === 'bill_payment') ? `Paid ${tx.description}` :
                    isSender ? `Paid to ${otherPartyName}` : `Received from ${otherPartyName}`;
                   
      const sign = isSender ? '-' : '+';
      const cssClass = isSender ? 'debit' : 'credit';
      
      const date = new Date(tx.created_at).toLocaleString();

      const item = document.createElement('div');
      item.className = 'lite-txn-item';
      item.innerHTML = `
        <div class="txn-details">
          <p class="title">${title}</p>
          <p class="date">${date}</p>
        </div>
        <div class="txn-amount ${cssClass}">${sign}₹${parseFloat(tx.amount).toFixed(2)}</div>
      `;
      txContainer.appendChild(item);
    });

  } catch (err) {
    console.error('Error fetching child tx:', err);
    txContainer.innerHTML = `<p style="color: red; text-align: center; font-size: 0.9rem;">Could not load transactions</p>`;
  }
}
